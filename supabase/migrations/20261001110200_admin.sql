-- Admin, without an admin page: views and functions in schema admin, run from
-- the dashboard's SQL editor (supabase/README.md). The schema isn't exposed
-- through the Data API, and nobody but postgres may use it.

create schema if not exists admin;
revoke all on schema admin from public, anon, authenticated;

-- Everyone in each beta: when they joined, whether their access still counts,
-- and whether they agreed to product news.
create view admin.beta_testers with (security_invoker = true) as
select
  e.program_id,
  u.email,
  p.display_name,
  e.starts_at as joined_at,
  e.status,
  public.entitlement_ends_at(e) as ends_at,
  p.marketing_opt_in,
  (select count(*) from public.devices d
    where d.user_id = e.user_id and d.product = e.product and d.released_at is null) as devices,
  e.user_id
from public.entitlements e
join auth.users u on u.id = e.user_id
join public.profiles p on p.id = e.user_id
where e.kind = 'beta'
order by e.starts_at;

-- Who agreed to product news, for an export (Table editor → Export, or `copy`).
create view admin.marketing_contacts with (security_invoker = true) as
select u.email, p.display_name, p.marketing_opt_in_changed_at as agreed_at
from public.profiles p
join auth.users u on u.id = p.id
where p.marketing_opt_in
order by p.marketing_opt_in_changed_at;

-- A device that signs in to many accounts is worth a look (trial abuse, or a
-- shared lab machine).
create view admin.shared_devices with (security_invoker = true) as
select d.product, d.device_hash, count(distinct d.user_id) as accounts, max(d.last_seen_at) as last_seen_at,
  array_agg(distinct u.email) as emails
from public.devices d
join auth.users u on u.id = d.user_id
group by d.product, d.device_hash
having count(distinct d.user_id) > 3
order by accounts desc;

-- Open or close a beta, or cap it (null: no cap).
create function admin.set_program(p_id text, p_open boolean, p_cap integer default null) returns public.programs
language sql set search_path = '' as $$
  update public.programs set open = p_open, cap = p_cap where id = p_id returning *;
$$;

-- 1.0: the program closes and every one of its beta entitlements ends now.
create function admin.end_program(p_id text) returns public.programs
language sql set search_path = '' as $$
  update public.programs set open = false, ended_at = coalesce(ended_at, now()) where id = p_id returning *;
$$;

revoke execute on all functions in schema admin from public, anon, authenticated;
