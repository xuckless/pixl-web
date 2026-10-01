-- Row-level security and grants for the PIXL account, checked against a real
-- database without leaving anything behind: everything runs in a transaction
-- that is rolled back. Paste into the SQL editor (or `supabase db query` /
-- psql); it ends in an error naming the first check that failed, or in
-- "rls: all checks passed".

begin;

-- Two accounts. The profile trigger names them from their Google-style metadata.
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-00000000000a', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rls-a@pixlfoundation.com', '{"full_name": "Ada Tester"}', now(), now()),
  ('00000000-0000-4000-8000-00000000000b', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'rls-b@pixlfoundation.com', '{"name": "rls-b@pixlfoundation.com"}', now(), now());

insert into public.entitlements (user_id, product, kind, program_id) values
  ('00000000-0000-4000-8000-00000000000a', 'playroom', 'beta', 'playroom-beta'),
  ('00000000-0000-4000-8000-00000000000b', 'playroom', 'beta', 'playroom-beta');
insert into public.devices (user_id, product, device_hash, name, os, app_version) values
  ('00000000-0000-4000-8000-00000000000a', 'playroom', repeat('a', 64), 'Studio (macOS)', 'macos', '0.2.0-beta.1'),
  ('00000000-0000-4000-8000-00000000000b', 'playroom', repeat('b', 64), 'Laptop (Windows)', 'windows', '0.2.0-beta.1');
insert into public.trial_devices (product, device_hash, user_id) values ('playroom', repeat('a', 64), '00000000-0000-4000-8000-00000000000a');

do $$ begin
  if (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') is distinct from 'Ada Tester' then
    raise exception 'profile trigger: name from full_name';
  end if;
  if (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000b') is not null then
    raise exception 'profile trigger: an email as a name is dropped';
  end if;
end $$;

-- ── as account A, signed in on the site ──
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'profiles: sees only its own'; end if;
  if (select count(*) from public.entitlements) <> 1 then raise exception 'entitlements: sees only its own'; end if;
  if (select count(*) from public.devices) <> 1 then raise exception 'devices: sees only its own'; end if;
  if (select count(*) from public.programs) < 1 then raise exception 'programs: readable'; end if;

  update public.profiles set display_name = 'Ada', marketing_opt_in = true;
  if (select marketing_opt_in_changed_at from public.profiles) is null then raise exception 'profiles: opt-in change is stamped'; end if;
  -- B's profile is out of reach: the update matches nothing.
  update public.profiles set display_name = 'Mallory' where id = '00000000-0000-4000-8000-00000000000b';

  begin
    update public.profiles set ls_customer_id = 1;
    raise exception 'profiles: ls_customer_id must not be writable';
  exception when insufficient_privilege then null;
  end;
  begin
    perform device_hash from public.devices;
    raise exception 'devices: device_hash must not be readable';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.entitlements (user_id, product, kind) values ('00000000-0000-4000-8000-00000000000a', 'playroom', 'licence');
    raise exception 'entitlements: users must not insert';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.trial_devices;
    raise exception 'trial_devices: not readable';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.webhook_events;
    raise exception 'webhook_events: not readable';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from admin.beta_testers;
    raise exception 'admin: not reachable';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── as account A, through an app's OAuth token: reads yes, profile edits no ──
set local request.jwt.claims = '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated", "client_id": "83eab600-baf2-4f5e-aac4-252010db94b2"}';
do $$ declare n int; begin
  if (select count(*) from public.entitlements) <> 1 then raise exception 'app token: reads its entitlements'; end if;
  update public.profiles set display_name = 'From the app';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'app token: must not edit the profile'; end if;
end $$;

-- ── anonymous ──
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
do $$ begin
  if (select count(*) from public.programs) < 1 then raise exception 'anon: programs readable'; end if;
  begin
    perform 1 from public.profiles;
    raise exception 'anon: profiles not readable';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$ begin
  if (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000b') is not null then
    raise exception 'profiles: B was changed by A';
  end if;
  if (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') <> 'Ada' then
    raise exception 'profiles: A''s own edit was lost';
  end if;
  -- Deleting an account takes its rows, but the trial stays with the device.
  delete from auth.users where id = '00000000-0000-4000-8000-00000000000a';
  if exists (select 1 from public.entitlements where user_id = '00000000-0000-4000-8000-00000000000a') then
    raise exception 'delete: entitlements cascade';
  end if;
  if (select user_id from public.trial_devices where device_hash = repeat('a', 64)) is not null
     or not exists (select 1 from public.trial_devices where device_hash = repeat('a', 64)) then
    raise exception 'delete: the trial device stays, without its account';
  end if;
  raise exception 'rls: all checks passed' using errcode = 'P0001';
end $$;

rollback;
