-- The Worker's functions for the apps (check_in, start_trial, release_device),
-- checked against a real database without leaving anything behind: it all
-- runs in a transaction that ends in an error, so nothing is kept. Ends in
-- "devices: all checks passed", or names the first check that failed.
--   supabase db query --linked -f supabase/tests/devices.sql

begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-a@pixlfoundation.com', now(), now()),
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev-b@pixlfoundation.com', now(), now());

do $$
declare
  a uuid := '00000000-0000-4000-8000-0000000000a1';
  b uuid := '00000000-0000-4000-8000-0000000000b1';
  r jsonb;
  d1 text := repeat('1', 64); d2 text := repeat('2', 64); d3 text := repeat('3', 64); d4 text := repeat('4', 64);
  freed uuid;
begin
  -- Nothing held: signed in, no device taken, no ent keys but addons.
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if r ? 'error' or r -> 'ent' <> '{"addons": []}'::jsonb then raise exception 'empty account: %', r; end if;
  if exists (select 1 from public.devices where user_id = a) then raise exception 'empty account took a device'; end if;

  -- A beta build without beta access.
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '0.2.0-beta.1', true);
  if r ->> 'error' is distinct from 'no_beta' then raise exception 'no_beta: %', r; end if;

  -- With beta access: three devices fit, the fourth doesn't; the same device again doesn't count twice.
  insert into public.entitlements (user_id, product, kind, program_id) values (a, 'playroom', 'beta', 'playroom-beta');
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '0.2.0-beta.1', true);
  if r ? 'error' or not (r -> 'ent' ? 'beta') or r -> 'ent' -> 'beta' ? 'until' then raise exception 'beta: %', r; end if;
  r := public.check_in(a, 'playroom', d1, 'Mac renamed', 'macos', '0.2.0-beta.2', true);
  r := public.check_in(a, 'playroom', d2, 'PC', 'windows', '0.2.0-beta.1', true);
  r := public.check_in(a, 'playroom', d3, 'Laptop', 'macos', '0.2.0-beta.1', true);
  if (select count(*) from public.devices where user_id = a) <> 3 then raise exception 'three devices expected'; end if;
  if (select name from public.devices where device_hash = d1) <> 'Mac renamed' then raise exception 'seen again updates the name'; end if;
  r := public.check_in(a, 'playroom', d4, 'Fourth', 'windows', '0.2.0-beta.1', true);
  if r ->> 'error' is distinct from 'device_limit' or jsonb_array_length(r -> 'devices') <> 3 then raise exception 'device_limit: %', r; end if;

  -- Free one (not someone else's), then the fourth fits.
  select id into freed from public.devices where device_hash = d2;
  if public.release_device(b, freed) then raise exception 'B freed A''s device'; end if;
  if public.release_device(a, freed, 'space') then raise exception 'freed through another product'; end if;
  if not public.release_device(a, freed, 'playroom') then raise exception 'release failed'; end if;
  r := public.check_in(a, 'playroom', d4, 'Fourth', 'windows', '0.2.0-beta.1', true);
  if r ? 'error' then raise exception 'after freeing: %', r; end if;
  -- The freed device comes back only if there's room.
  r := public.check_in(a, 'playroom', d2, 'PC', 'windows', '0.2.0-beta.1', true);
  if r ->> 'error' is distinct from 'device_limit' then raise exception 'freed device over the limit: %', r; end if;

  -- The beta ends at 1.0: a beta build is told so; the token still says when beta ended.
  update public.programs set ended_at = now() - interval '1 second' where id = 'playroom-beta';
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '0.2.0-beta.3', true);
  if r ->> 'error' is distinct from 'beta_ended' then raise exception 'beta_ended: %', r; end if;
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if r ? 'error' or (r -> 'ent' -> 'beta' ->> 'until') is null or (r ->> 'limit')::int <> 0 then raise exception 'after the beta: %', r; end if;

  -- Trial: once per account, once per device; idempotent while it runs.
  r := public.start_trial(a, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if r ? 'error' or (r -> 'ent' -> 'trial' ->> 'until')::bigint < extract(epoch from now() + interval '13 days') then raise exception 'trial: %', r; end if;
  r := public.start_trial(a, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if r ? 'error' then raise exception 'trial again while it runs: %', r; end if;
  if (select count(*) from public.entitlements where user_id = a and kind = 'trial') <> 1 then raise exception 'one trial row'; end if;
  r := public.start_trial(b, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if r ->> 'error' is distinct from 'trial_used_device' then raise exception 'trial_used_device: %', r; end if;
  -- The trial ends: still in the token, with until in the past; no second trial.
  update public.entitlements set ends_at = now() - interval '1 second' where user_id = a and kind = 'trial';
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if (r -> 'ent' -> 'trial' ->> 'until')::bigint > extract(epoch from now()) then raise exception 'ended trial: %', r; end if;
  r := public.start_trial(a, 'playroom', d3, 'Laptop', 'macos', '1.0.0', false);
  if r ->> 'error' is distinct from 'trial_used_account' then raise exception 'trial_used_account: %', r; end if;
  -- B on a fresh device can.
  r := public.start_trial(b, 'playroom', repeat('5', 64), 'B Mac', 'macos', '1.0.0', false);
  if r ? 'error' then raise exception 'B trial: %', r; end if;

  -- A licence: since, and a discount code shows.
  insert into public.entitlements (user_id, product, kind, ls_order_id) values (a, 'playroom', 'licence', 1);
  insert into public.discount_codes (user_id, product, program_id, code, expires_at) values (a, 'playroom', 'playroom-beta', 'TEST-CODE', now() + interval '90 days');
  r := public.check_in(a, 'playroom', d1, 'Mac', 'macos', '1.0.0', false);
  if r ? 'error' or (r -> 'ent' -> 'licence' ->> 'since') is null or r -> 'discount' ->> 'code' <> 'TEST-CODE' then raise exception 'licence: %', r; end if;

  -- Not callable by users.
  if has_function_privilege('authenticated', 'public.check_in(uuid, text, text, text, text, text, boolean)', 'execute')
     or has_function_privilege('anon', 'public.start_trial(uuid, text, text, text, text, text, boolean)', 'execute')
     or has_function_privilege('authenticated', 'public.release_device(uuid, uuid, text)', 'execute') then
    raise exception 'functions must be service_role only';
  end if;

  raise exception 'devices: all checks passed' using errcode = 'P0001';
end $$;

rollback;
