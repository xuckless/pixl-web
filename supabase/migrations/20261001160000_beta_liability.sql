-- Joining the beta also takes a separate confirmation of the beta terms'
-- section 9 (no warranty, no liability), ticked on its own on the beta page.
-- It's recorded beside the terms acceptance, as its own agreement
-- ("<product>-beta-liability", same version and time), so it can be shown.

drop function public.join_beta(uuid, text, text, boolean);

create function public.join_beta(p_user uuid, p_program text, p_terms_version text, p_marketing boolean, p_liability boolean)
returns jsonb
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
  if p_liability is not true then
    return jsonb_build_object('error', 'liability_required');
  end if;

  insert into public.agreements (user_id, document, version) values
    (p_user, p.product || '-beta-terms', p.terms_version),
    (p_user, p.product || '-beta-liability', p.terms_version)
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

revoke execute on function public.join_beta(uuid, text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.join_beta(uuid, text, text, boolean, boolean) to service_role;
