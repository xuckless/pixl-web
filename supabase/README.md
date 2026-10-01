# pixl-core: the PIXL account's database

Supabase project `pixl-core` (`lskosagqyekwklxyuczi`). Its schema is the
migrations here. The design is in TODO.md, under "PIXL account".

## Changing the schema

```sh
supabase link --project-ref lskosagqyekwklxyuczi   # once; asks for the database password
supabase migration new <name>                      # write the SQL
supabase db push --dry-run && supabase db push
supabase db query --linked -f supabase/tests/rls.sql   # ends in "rls: all checks passed"
```

Then check the advisors (Dashboard → Advisors, or the Supabase MCP). Two
notes are expected: `trial_devices` and `webhook_events` have RLS on and no
policies, because only the Worker touches them.

Rules the migrations keep:

- Nothing is granted to `anon` or `authenticated` by default. Every grant is
  written out, and every table has RLS on.
- Functions get `set search_path = ''`.
- Functions the Worker calls are executable by `service_role` only.

`supabase/config.toml` is for a local stack only. Never `supabase config push`.

## Sign-up hook

Auth → Hooks → Before User Created runs
`pg-functions://postgres/private/hook_before_user_created`. It refuses
addresses at a domain in `private.blocked_email_domains`, or a subdomain of
one. It was turned on through the Management API (2026-10-01).
Admin-created users (the dashboard, the admin API) skip it.

To refresh the list, run `node scripts/disposable-domains.mts`, then
`supabase db push`. The script never blocks Apple's private relay or the big
providers.

## Admin (SQL editor)

| What | SQL |
|---|---|
| Testers in a beta | `select * from admin.beta_testers where program_id = 'playroom-beta';` |
| Product-news emails | `select * from admin.marketing_contacts;` (export from the results) |
| Devices on more than 3 accounts | `select * from admin.shared_devices;` |
| Close the beta, or cap it | `select * from admin.set_program('playroom-beta', false);` · `select * from admin.set_program('playroom-beta', true, 500);` |
| End the beta (1.0) | `select * from admin.end_program('playroom-beta');` |

Ending a program ends every one of its beta entitlements at once, through
`public.entitlement_ends_at`. The apps lose beta access at their next
refresh.
