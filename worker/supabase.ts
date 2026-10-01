// pixl-core (Supabase) from the Worker: its database functions and its auth
// admin API, with the secret key. Plain fetch: supabase-js would bring
// realtime and storage along for two kinds of call.

export interface SupabaseEnv {
  /** https://<ref>.supabase.co (wrangler.jsonc vars). */
  SUPABASE_URL: string
  /** pixl-core's secret key, sb_secret_… (`wrangler secret put SUPABASE_SECRET_KEY`). */
  SUPABASE_SECRET_KEY?: string
}

export class SupabaseError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

function headers(env: SupabaseEnv): HeadersInit {
  if (!env.SUPABASE_SECRET_KEY) throw new SupabaseError('SUPABASE_SECRET_KEY is not set', 503)
  // The secret key goes in apikey; the bearer is for PostgREST's role (service_role).
  return { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`, 'Content-Type': 'application/json' }
}

/** A database function in public (supabase/migrations), e.g. rpc(env, 'check_in', {...}). */
export async function rpc<T>(env: SupabaseEnv, fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(env), body: JSON.stringify(args) })
  if (!res.ok) throw new SupabaseError(`rpc ${fn}: HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status)
  return (await res.json()) as T
}

/** Deletes an account; its rows go with it (foreign keys cascade). */
export async function deleteUser(env: SupabaseEnv, id: string): Promise<void> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers: headers(env) })
  if (!res.ok) throw new SupabaseError(`deleting user: HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status)
}
