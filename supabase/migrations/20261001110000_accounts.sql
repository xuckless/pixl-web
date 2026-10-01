-- The PIXL account: profiles, what each account holds (beta, trial, licence,
-- add-ons), the devices it's used on, and the records behind them.
--
-- Who can do what:
--   * A signed-in user reads only their own rows. On the site they may change
--     two profile fields (display name, product news); nothing else.
--   * Everything else is written by the Worker (worker/api.ts) with the secret
--     key (service_role), through the functions in later migrations.
--   * Nothing here is reachable by anon or authenticated unless granted below.

-- Supabase grants every new table and function in public to anon and
-- authenticated by default; this project grants explicitly instead.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- Not exposed through the Data API: triggers, helpers, the sign-up hook's list.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ─── profiles ───────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 80),
  -- Product news by email. When it last changed is kept as evidence of consent.
  marketing_opt_in boolean not null default false,
  marketing_opt_in_changed_at timestamptz,
  ls_customer_id bigint unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One per account, made when the account is. The user may change display_name and marketing_opt_in.';

create function private.profiles_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.marketing_opt_in is distinct from old.marketing_opt_in then
    new.marketing_opt_in_changed_at := now();
  end if;
  return new;
end;
$$;
create trigger profiles_touch before update on public.profiles
  for each row execute function private.profiles_touch();

-- A profile for every new account, named from Google or Apple when they give a
-- name (an email sign-up has none; a "name" that is the email address is dropped).
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '');
begin
  if v_name like '%@%' then v_name := null; end if;
  insert into public.profiles (id, display_name) values (new.id, left(v_name, 80));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ─── programs: a beta per product ───────────────────────────────────────────

create table public.programs (
  id text primary key,
  product text not null check (product in ('playroom', 'space')),
  -- Closed: no one new joins. A cap: no one joins past that many testers.
  open boolean not null default true,
  cap integer check (cap >= 0),
  -- The beta terms a tester accepts to join (src/legal/beta.md).
  terms_version text not null,
  -- Set at 1.0: every beta entitlement of this program ends then.
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.programs is 'Each product''s beta. Readable by anyone (the beta page shows whether it''s open).';

insert into public.programs (id, product, terms_version) values ('playroom-beta', 'playroom', '2026-10');

-- ─── entitlements: what an account holds ────────────────────────────────────

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('playroom', 'space')),
  kind text not null check (kind in ('beta', 'trial', 'licence', 'addon')),
  -- An add-on's tier (a cloud tier, the Pass).
  plan text,
  status text not null default 'active' check (status in ('active', 'revoked', 'ended')),
  starts_at timestamptz not null default now(),
  -- null: no end (a licence; a beta until its program ends).
  ends_at timestamptz,
  device_limit integer not null default 3 check (device_limit > 0),
  program_id text references public.programs (id),
  -- What Lemon Squeezy sold, for refunds and reconciling.
  ls_order_id bigint unique,
  ls_subscription_id bigint unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'beta') = (program_id is not null)),
  check (kind <> 'addon' or plan is not null)
);
comment on table public.entitlements is 'Beta, trial, licence and add-ons per account and product. Written only by the Worker.';
create index entitlements_user on public.entitlements (user_id, product);
create index entitlements_program on public.entitlements (program_id) where program_id is not null;
-- One beta and one trial per account and product, ever.
create unique index entitlements_one_beta on public.entitlements (user_id, product) where kind = 'beta';
create unique index entitlements_one_trial on public.entitlements (user_id, product) where kind = 'trial';

create function private.touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger entitlements_touch before update on public.entitlements
  for each row execute function private.touch();

-- When an entitlement stops counting: its own end, or its program's.
create function public.entitlement_ends_at(e public.entitlements) returns timestamptz
language sql stable set search_path = '' as $$
  select least(e.ends_at, (select p.ended_at from public.programs p where p.id = e.program_id));
$$;

-- ─── devices ────────────────────────────────────────────────────────────────

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('playroom', 'space')),
  -- The app's hash of its machine id, hashed again with the Worker's pepper.
  device_hash text not null check (device_hash ~ '^[0-9a-f]{64}$'),
  name text not null check (char_length(name) between 1 and 100),
  os text not null check (os in ('macos', 'windows', 'linux')),
  app_version text not null check (char_length(app_version) between 1 and 40),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Freed from the account page or the app: it no longer counts against the limit.
  released_at timestamptz,
  unique (user_id, product, device_hash)
);
comment on table public.devices is 'Where each account uses each product. Written only by the Worker.';
create index devices_hash on public.devices (product, device_hash);

-- ─── trial_devices: one trial per device ────────────────────────────────────

-- Every device that ran a product on a trial. Kept when the account is deleted
-- (user_id goes null), so a new account on the same machine gets no new trial.
-- One trial per account is entitlements_one_trial.
create table public.trial_devices (
  product text not null check (product in ('playroom', 'space')),
  device_hash text not null check (device_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid references auth.users (id) on delete set null,
  first_at timestamptz not null default now(),
  primary key (product, device_hash)
);
comment on table public.trial_devices is 'Devices that have had a trial. Not readable by users.';
create index trial_devices_user on public.trial_devices (user_id) where user_id is not null;

-- ─── agreements ─────────────────────────────────────────────────────────────

create table public.agreements (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 'playroom-beta-terms', later the licence agreement.
  document text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, document, version)
);
comment on table public.agreements is 'Which terms each account accepted, and when.';

-- ─── webhook_events ─────────────────────────────────────────────────────────

-- Every Lemon Squeezy webhook once (it retries): the id is the SHA-256 of the
-- raw body, which a retry repeats exactly.
create table public.webhook_events (
  id text primary key,
  source text not null default 'lemonsqueezy',
  event_name text not null,
  test_mode boolean not null default false,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);
comment on table public.webhook_events is 'Webhooks received, for idempotency and replay. Not readable by users.';

-- ─── discount_codes ─────────────────────────────────────────────────────────

-- A tester's one-use code at 1.0 (Lemon Squeezy discount), shown on the account page.
create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null check (product in ('playroom', 'space')),
  program_id text references public.programs (id),
  code text not null unique,
  ls_discount_id bigint unique,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create index discount_codes_user on public.discount_codes (user_id);

-- ─── row-level security ─────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.entitlements enable row level security;
alter table public.devices enable row level security;
alter table public.trial_devices enable row level security;
alter table public.agreements enable row level security;
alter table public.webhook_events enable row level security;
alter table public.discount_codes enable row level security;

grant select on public.programs to anon, authenticated;
create policy "Anyone reads the programs" on public.programs for select to anon, authenticated using (true);

grant select on public.profiles to authenticated;
-- Column grants: the rest of a profile (ls_customer_id, the timestamps) is the Worker's.
grant update (display_name, marketing_opt_in) on public.profiles to authenticated;
create policy "Users read their profile" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
-- Only from the site: an app's OAuth token (it carries client_id) can't edit the profile.
create policy "Users edit their profile on the site" on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select auth.jwt() ->> 'client_id') is null)
  with check (id = (select auth.uid()) and (select auth.jwt() ->> 'client_id') is null);

grant select on public.entitlements to authenticated;
create policy "Users read their entitlements" on public.entitlements for select to authenticated
  using (user_id = (select auth.uid()));

-- Not the device hash: the account page has no use for it.
grant select (id, user_id, product, name, os, app_version, first_seen_at, last_seen_at, released_at)
  on public.devices to authenticated;
create policy "Users read their devices" on public.devices for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.agreements to authenticated;
create policy "Users read their agreements" on public.agreements for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.discount_codes to authenticated;
create policy "Users read their discount codes" on public.discount_codes for select to authenticated
  using (user_id = (select auth.uid()));

-- trial_devices and webhook_events: no grants, no policies; the Worker only.

grant execute on function public.entitlement_ends_at(public.entitlements) to authenticated;
