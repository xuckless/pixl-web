-- Joining a beta (playroom.pixlfoundation.com/beta/): accept the beta terms,
-- and the account gets beta access. The page reads beta_status (anyone may);
-- joining goes through the Worker (POST /api/beta/join), which calls
-- join_beta with the secret key.

-- Whether a beta takes new testers: open, full or over. Only these flags: the
-- tester count stays private.
create function public.beta_status(p_program text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'open', p.open,
    'ended', p.ended_at is not null and p.ended_at <= now(),
    'full', p.cap is not null and (select count(*) from public.entitlements e where e.program_id = p.id) >= p.cap,
    'terms', p.terms_version
  )
  from public.programs p where p.id = p_program;
$$;
revoke execute on function public.beta_status(text) from public;
grant execute on function public.beta_status(text) to anon, authenticated, service_role;

-- Join: records the accepted terms and grants beta access (three devices).
-- Idempotent: someone already in stays in, whatever the program's state.
-- Answers { joined: true } or { error: closed | full | beta_ended | terms_changed | no_program }.
create function public.join_beta(p_user uuid, p_program text, p_terms_version text, p_marketing boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  p public.programs;
begin
  -- Locked, so two joins can't both take the last place under a cap.
  select * into p from public.programs where id = p_program for update;
  if not found then
    return jsonb_build_object('error', 'no_program');
  end if;
  if exists (select 1 from public.entitlements where user_id = p_user and product = p.product and kind = 'beta') then
    return jsonb_build_object('joined', true);
  end if;
  if p.ended_at is not null and p.ended_at <= now() then
    return jsonb_build_object('error', 'beta_ended');
  end if;
  if not p.open then
    return jsonb_build_object('error', 'closed');
  end if;
  if p.cap is not null and (select count(*) from public.entitlements where program_id = p.id) >= p.cap then
    return jsonb_build_object('error', 'full');
  end if;
  if p_terms_version is distinct from p.terms_version then
    return jsonb_build_object('error', 'terms_changed');
  end if;

  insert into public.agreements (user_id, document, version) values (p_user, p.product || '-beta-terms', p.terms_version)
    on conflict do nothing;
  insert into public.entitlements (user_id, product, kind, program_id, device_limit) values (p_user, p.product, 'beta', p.id, 3);
  -- Agreeing to product news here only ever turns it on; the account page turns it off.
  if p_marketing then
    update public.profiles set marketing_opt_in = true where id = p_user and not marketing_opt_in;
  end if;
  return jsonb_build_object('joined', true);
end;
$$;
revoke execute on function public.join_beta(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.join_beta(uuid, text, text, boolean) to service_role;
