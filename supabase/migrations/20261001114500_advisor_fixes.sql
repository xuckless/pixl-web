-- What Supabase's advisors found after the first push.

-- Supabase's own event-trigger helper (it turns RLS on for new tables) came
-- callable by anyone through /rest/v1/rpc. The event trigger doesn't need that.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- auth.jwt() once per statement, not once per row.
alter policy "Users edit their profile on the site" on public.profiles
  using (id = (select auth.uid()) and ((select auth.jwt()) ->> 'client_id') is null)
  with check (id = (select auth.uid()) and ((select auth.jwt()) ->> 'client_id') is null);

create index discount_codes_program on public.discount_codes (program_id) where program_id is not null;

-- trial_devices and webhook_events have RLS on and no policies on purpose:
-- only the Worker (service_role, which bypasses RLS) reads or writes them.
