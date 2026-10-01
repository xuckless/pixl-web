// Shared by the scripts that manage the PIXL account (Supabase project pixl-core).
// Keys come from the Management API with the Supabase CLI's own token (kept in the
// keychain by `supabase login`), so nothing secret is written to disk or the repo.
import { execFileSync } from 'node:child_process'

export const PROJECT_REF = 'lskosagqyekwklxyuczi'
export const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`

/** The Supabase CLI's access token, from the macOS keychain. */
export function managementToken(): string {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN
  let token = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w']).toString().trim()
  if (token.startsWith('go-keyring-base64:')) token = Buffer.from(token.slice('go-keyring-base64:'.length), 'base64').toString()
  return token
}

/** A call to the Management API for pixl-core: `management('/config/auth')`. */
export async function management<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${managementToken()}`, 'Content-Type': 'application/json', ...init.headers }
  })
  if (!res.ok) throw new Error(`Management API ${path}: HTTP ${res.status}: ${await res.text()}`)
  return (await res.json()) as T
}

interface ApiKey {
  name: string
  type: 'legacy' | 'publishable' | 'secret'
  api_key: string
}

/** The project's publishable key and secret key (`SUPABASE_SECRET_KEY` overrides the latter). */
export async function apiKeys(): Promise<{ publishable: string; secret: string }> {
  const keys = await management<ApiKey[]>('/api-keys?reveal=true')
  const publishable = keys.find((k) => k.type === 'publishable')?.api_key
  const secret = process.env.SUPABASE_SECRET_KEY ?? keys.find((k) => k.type === 'secret')?.api_key
  if (!publishable || !secret) throw new Error('pixl-core has no publishable or secret key')
  return { publishable, secret }
}
