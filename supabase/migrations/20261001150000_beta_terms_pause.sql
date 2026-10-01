-- Changed beta terms pause beta access until they're accepted again (the beta
-- terms, section 10). Bumping programs.terms_version (and `version:` in
-- src/legal/beta.md) is the change: a tester's beta counts only while they
-- have accepted the program's current terms. The app then gets no_beta and
-- shows "Join the beta"; the beta page asks them to accept the new terms,
-- and join_beta records it.

-- account_holdings: as before, but an active beta also needs the current terms
-- accepted; `beta_terms` says when that's all that's missing.
create or replace function public.account_holdings(p_user uuid, p_product text) returns jsonb
language sql stable set search_path = '' as $$
  with mine as (
    select e.*,
      case when e.status = 'active' then public.entitlement_ends_at(e)
           else least(coalesce(public.entitlement_ends_at(e), e.updated_at), e.updated_at) end as ends,
      -- A beta counts only with its program's current terms accepted.
      e.kind <> 'beta' or exists (
        select 1 from public.programs p
        join public.agreements a on a.user_id = e.user_id and a.document = p.product || '-beta-terms' and a.version = p.terms_version
        where p.id = e.program_id
      ) as terms_ok
    from public.entitlements e
    where e.user_id = p_user and e.product = p_product and e.starts_at <= now()
  ), live as (
    select * from mine where status = 'active' and (ends is null or ends > now())
  ), active as (
    select * from live where terms_ok
  )
  select jsonb_build_object(
    'ent', jsonb_strip_nulls(jsonb_build_object(
      'beta', (select jsonb_strip_nulls(jsonb_build_object('until', extract(epoch from ends)::bigint)) from mine where kind = 'beta' limit 1),
      'trial', (select jsonb_build_object('until', extract(epoch from ends)::bigint) from mine where kind = 'trial' limit 1),
      'licence', (select jsonb_build_object('since', extract(epoch from min(starts_at))::bigint) from active where kind = 'licence' having count(*) > 0),
      'addons', coalesce((select jsonb_agg(distinct plan) from active where kind = 'addon'), '[]'::jsonb)
    )),
    'active', jsonb_build_object(
      'beta', exists (select 1 from active where kind = 'beta'),
      'trial', exists (select 1 from active where kind = 'trial'),
      'licence', exists (select 1 from active where kind = 'licence')
    ),
    -- In the beta, but the terms changed since they accepted.
    'beta_terms', exists (select 1 from live where kind = 'beta' and not terms_ok),
    'limit', coalesce((select max(device_limit) from active), 0),
    'beta_ended', exists (
      select 1 from public.programs p
      where p.product = p_product and p.ended_at is not null and p.ended_at <= now()
    ),
    'discount', (
      select jsonb_build_object('code', d.code, 'expires', extract(epoch from d.expires_at)::bigint)
      from public.discount_codes d
      where d.user_id = p_user and d.product = p_product and d.redeemed_at is null and d.expires_at > now()
      order by d.expires_at desc limit 1
    )
  );
$$;

-- join_beta: someone already in, but behind on the terms, accepts the new
-- ones here, even while the beta is closed or full to newcomers.
create or replace function public.join_beta(p_user uuid, p_program text, p_terms_version text, p_marketing boolean) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  p public.programs;
  already boolean;
begin
  select * into p from public.programs where id = p_program for update;
  if not found then
    return jsonb_build_object('error', 'no_program');
  end if;
  if p.ended_at is not null and p.ended_at <= now() then
    return jsonb_build_object('error', 'beta_ended');
  end if;
  already := exists (select 1 from public.entitlements where user_id = p_user and product = p.product and kind = 'beta');
  if not already then
    if not p.open then
      return jsonb_build_object('error', 'closed');
    end if;
    if p.cap is not null and (select count(*) from public.entitlements where program_id = p.id) >= p.cap then
      return jsonb_build_object('error', 'full');
    end if;
  end if;
  if p_terms_version is distinct from p.terms_version then
    return jsonb_build_object('error', 'terms_changed');
  end if;

  insert into public.agreements (user_id, document, version) values (p_user, p.product || '-beta-terms', p.terms_version)
    on conflict do nothing;
  if not already then
    insert into public.entitlements (user_id, product, kind, program_id, device_limit) values (p_user, p.product, 'beta', p.id, 3);
  end if;
  if p_marketing then
    update public.profiles set marketing_opt_in = true where id = p_user and not marketing_opt_in;
  end if;
  return jsonb_build_object('joined', true);
end;
$$;

revoke execute on function public.account_holdings(uuid, text) from public, anon, authenticated;
revoke execute on function public.join_beta(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.account_holdings(uuid, text) to service_role;
grant execute on function public.join_beta(uuid, text, text, boolean) to service_role;
