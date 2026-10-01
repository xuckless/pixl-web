-- Joining a beta (join_beta, beta_status), in a transaction that is never
-- kept. Ends in "beta: all checks passed", or names the first failure.
--   supabase db query --linked -f supabase/tests/beta.sql

begin;

insert into auth.users (id, instance_id, aud, role, email, created_at, updated_at) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beta-a@pixlfoundation.com', now(), now()),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beta-b@pixlfoundation.com', now(), now());

do $$
declare
  a uuid := '00000000-0000-4000-8000-0000000000c1';
  b uuid := '00000000-0000-4000-8000-0000000000c2';
  terms text := (select terms_version from public.programs where id = 'playroom-beta');
  r jsonb;
begin
  r := public.beta_status('playroom-beta');
  if not (r ->> 'open')::boolean or (r ->> 'full')::boolean or (r ->> 'ended')::boolean then raise exception 'status: %', r; end if;

  r := public.join_beta(a, 'playroom-beta', 'old-terms', false);
  if r ->> 'error' is distinct from 'terms_changed' then raise exception 'terms_changed: %', r; end if;
  r := public.join_beta(a, 'playroom-beta', terms, true);
  if r ->> 'joined' is distinct from 'true' then raise exception 'join: %', r; end if;
  if not exists (select 1 from public.agreements where user_id = a and document = 'playroom-beta-terms' and version = terms) then raise exception 'agreement'; end if;
  if not (select marketing_opt_in from public.profiles where id = a) then raise exception 'opt-in'; end if;
  r := public.join_beta(a, 'playroom-beta', terms, false);
  if r ->> 'joined' is distinct from 'true' or (select count(*) from public.entitlements where user_id = a) <> 1 then raise exception 'join twice: %', r; end if;
  if not (select marketing_opt_in from public.profiles where id = a) then raise exception 'joining again turned news off'; end if;

  -- A cap of the testers there are: full for newcomers, not for those in.
  update public.programs set cap = (select count(*) from public.entitlements where program_id = 'playroom-beta') where id = 'playroom-beta';
  if not (public.beta_status('playroom-beta') ->> 'full')::boolean then raise exception 'full status'; end if;
  r := public.join_beta(b, 'playroom-beta', terms, false);
  if r ->> 'error' is distinct from 'full' then raise exception 'full: %', r; end if;
  update public.programs set cap = null, open = false where id = 'playroom-beta';
  r := public.join_beta(b, 'playroom-beta', terms, false);
  if r ->> 'error' is distinct from 'closed' then raise exception 'closed: %', r; end if;
  update public.programs set ended_at = now() - interval '1 second' where id = 'playroom-beta';
  r := public.join_beta(b, 'playroom-beta', terms, false);
  if r ->> 'error' is distinct from 'beta_ended' then raise exception 'ended: %', r; end if;

  if has_function_privilege('authenticated', 'public.join_beta(uuid, text, text, boolean)', 'execute') then raise exception 'join_beta must be the Worker''s'; end if;
  if not has_function_privilege('anon', 'public.beta_status(text)', 'execute') then raise exception 'beta_status is public'; end if;

  raise exception 'beta: all checks passed' using errcode = 'P0001';
end $$;

rollback;
