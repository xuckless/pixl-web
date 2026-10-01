-- Sign-ups from disposable email domains are refused: Supabase Auth's "Before
-- User Created" hook (enabled in the project's auth config; see
-- supabase/README.md) calls private.hook_before_user_created for every new
-- account, by email code, Google or Apple alike. The list of domains is
-- loaded by a generated migration (scripts/disposable-domains.mts).

create table private.blocked_email_domains (
  domain text primary key check (domain = lower(domain) and domain like '%.%')
);
comment on table private.blocked_email_domains is 'Disposable email domains; a sign-up from one of them, or a subdomain of one, is refused.';

-- Not security definer: Supabase Auth runs it as supabase_auth_admin, which is
-- granted exactly what it needs below. Keep it trivial: an error here blocks
-- every sign-up.
create function private.hook_before_user_created(event jsonb) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  domain text := lower(split_part(coalesce(event -> 'user' ->> 'email', ''), '@', 2));
  labels text[] := string_to_array(domain, '.');
  suffixes text[] := '{}';
begin
  if domain = '' then
    return '{}'::jsonb;
  end if;
  -- mail.example.com → {mail.example.com, example.com}
  for i in 1 .. coalesce(array_length(labels, 1), 0) - 1 loop
    suffixes := suffixes || array_to_string(labels[i:], '.');
  end loop;
  if exists (select 1 from private.blocked_email_domains b where b.domain = any (suffixes)) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'Please use a permanent email address. Disposable addresses can''t sign up.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;

grant usage on schema private to supabase_auth_admin;
grant select on private.blocked_email_domains to supabase_auth_admin;
revoke execute on function private.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function private.hook_before_user_created(jsonb) to supabase_auth_admin;
