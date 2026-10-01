-- What the Worker calls for the apps (worker/api.ts: /api/entitlements,
-- /api/trials, /api/devices/:id), as functions so each decision is one
-- transaction: count the devices, then register one, with no race between.
-- Executable by service_role only (the Worker's secret key). Device hashes
-- arrive already peppered by the Worker.

-- What an account holds for a product, as the entitlement token's `ent`
-- (TODO.md, "Contract with the apps"):
--   * beta and trial appear once they ever existed, with `until` in the past
--     when over (the app reads "no trial key" as "never started");
--   * licence and add-ons only while active.
-- Also `active` (what counts now), the device limit, whether the product's
-- beta has ended, and an unused discount code.
create function public.account_holdings(p_user uuid, p_product text) returns jsonb
language sql stable set search_path = '' as $$
  with mine as (
    select e.*,
      -- When it stops (or stopped) counting: its end, its program's end, or when it was revoked.
      case when e.status = 'active' then public.entitlement_ends_at(e)
           else least(coalesce(public.entitlement_ends_at(e), e.updated_at), e.updated_at) end as ends
    from public.entitlements e
    where e.user_id = p_user and e.product = p_product and e.starts_at <= now()
  ), active as (
    select * from mine where status = 'active' and (ends is null or ends > now())
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
    'limit', coalesce((select max(device_limit) from active), 0),
    -- A beta build needs to know whether the beta is over, not just absent.
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

-- The app checks in: if the account holds anything, this device is
-- registered (or seen again) within the device limit. Answers the holdings,
-- or an error the Worker passes on: no_beta, beta_ended, device_limit.
create function public.check_in(
  p_user uuid, p_product text, p_hash text, p_name text, p_os text, p_version text, p_beta_build boolean
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  h jsonb;
  lim integer;
  dev public.devices;
  used integer;
begin
  -- One check-in per account and product at a time: the count and the insert can't interleave.
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_product, 0));
  h := public.account_holdings(p_user, p_product);

  if p_beta_build and not (h -> 'active' ->> 'beta')::boolean then
    return jsonb_build_object('error', case when (h ->> 'beta_ended')::boolean then 'beta_ended' else 'no_beta' end);
  end if;

  lim := (h ->> 'limit')::integer;
  -- Holding nothing: signed in, but no device is taken.
  if lim = 0 then
    return h;
  end if;

  select * into dev from public.devices where user_id = p_user and product = p_product and device_hash = p_hash;
  if found and dev.released_at is null then
    update public.devices
      set name = p_name, os = p_os, app_version = p_version, last_seen_at = now()
      where id = dev.id;
  else
    select count(*) into used from public.devices
      where user_id = p_user and product = p_product and released_at is null;
    if used >= lim then
      return jsonb_build_object(
        'error', 'device_limit',
        'limit', lim,
        'devices', (
          select jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'lastSeen', extract(epoch from d.last_seen_at)::bigint) order by d.last_seen_at desc)
          from public.devices d where d.user_id = p_user and d.product = p_product and d.released_at is null
        )
      );
    end if;
    insert into public.devices (user_id, product, device_hash, name, os, app_version)
      values (p_user, p_product, p_hash, p_name, p_os, p_version)
      on conflict (user_id, product, device_hash) do update
        set name = excluded.name, os = excluded.os, app_version = excluded.app_version,
            last_seen_at = now(), released_at = null;
  end if;

  -- A device that runs a trial can't start another one under a new account.
  if (h -> 'active' ->> 'trial')::boolean then
    insert into public.trial_devices (product, device_hash, user_id) values (p_product, p_hash, p_user)
      on conflict do nothing;
  end if;
  return h;
end;
$$;

-- "Start 14-day trial": once per account and once per device, for each
-- product. Idempotent while the trial runs. Then checks in like check_in.
create function public.start_trial(
  p_user uuid, p_product text, p_hash text, p_name text, p_os text, p_version text, p_beta_build boolean
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  h jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_product, 0));
  h := public.account_holdings(p_user, p_product);

  -- A beta build runs on beta access, and something already held needs no trial.
  if p_beta_build or (h -> 'active' ->> 'licence')::boolean or (h -> 'active' ->> 'trial')::boolean then
    return public.check_in(p_user, p_product, p_hash, p_name, p_os, p_version, p_beta_build);
  end if;

  if exists (select 1 from public.entitlements where user_id = p_user and product = p_product and kind = 'trial') then
    return jsonb_build_object('error', 'trial_used_account');
  end if;
  if exists (
    select 1 from public.trial_devices t
    where t.product = p_product and t.device_hash = p_hash and t.user_id is distinct from p_user
  ) then
    return jsonb_build_object('error', 'trial_used_device');
  end if;

  insert into public.entitlements (user_id, product, kind, ends_at, device_limit)
    values (p_user, p_product, 'trial', now() + interval '14 days', 3);
  insert into public.trial_devices (product, device_hash, user_id) values (p_product, p_hash, p_user)
    on conflict do nothing;
  return public.check_in(p_user, p_product, p_hash, p_name, p_os, p_version, p_beta_build);
end;
$$;

-- "Free this device", from the account page or the app. With p_product, only
-- that product's devices (an app's token frees only its own product's).
create function public.release_device(p_user uuid, p_device uuid, p_product text default null) returns boolean
language sql security definer set search_path = '' as $$
  with freed as (
    update public.devices set released_at = now()
    where id = p_device and user_id = p_user and released_at is null
      and (p_product is null or product = p_product)
    returning 1
  )
  select exists (select 1 from freed);
$$;

revoke execute on function public.account_holdings(uuid, text) from public, anon, authenticated;
revoke execute on function public.check_in(uuid, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.start_trial(uuid, text, text, text, text, text, boolean) from public, anon, authenticated;
revoke execute on function public.release_device(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.account_holdings(uuid, text) to service_role;
grant execute on function public.check_in(uuid, text, text, text, text, text, boolean) to service_role;
grant execute on function public.start_trial(uuid, text, text, text, text, text, boolean) to service_role;
grant execute on function public.release_device(uuid, uuid, text) to service_role;
