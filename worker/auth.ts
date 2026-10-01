// Who is calling: a Supabase access token, checked against pixl-core's
// signing keys (JWKS, cached per isolate). Tokens from an app's sign-in carry
// the OAuth client_id; the sites' own sessions don't.

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { SupabaseEnv } from './supabase'

export interface AuthEnv extends SupabaseEnv {
  /** OAuth client id → the product its app is (wrangler.jsonc vars). */
  APP_CLIENTS: Record<string, string>
}

export interface Caller {
  userId: string
  email?: string
  /** The app's OAuth client, or null for a session on the sites. */
  clientId: string | null
  /** The product an app's client belongs to (APP_CLIENTS), or null. */
  product: string | null
  /** When each sign-in method was last used (unix seconds); e.g. for "signed in in the last 10 minutes". */
  amr: { method: string; timestamp: number }[]
}

let jwks: { url: string; set: ReturnType<typeof createRemoteJWKSet> } | undefined

/** The signed-in caller, or null when the token is missing, invalid, expired or anonymous. */
export async function caller(request: Request, env: AuthEnv): Promise<Caller | null> {
  const token = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '')?.[1]
  if (!token) return null
  const issuer = `${env.SUPABASE_URL}/auth/v1`
  if (jwks?.url !== issuer) jwks = { url: issuer, set: createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), { cacheMaxAge: 10 * 60_000 }) }
  let claims: JWTPayload & { email?: string; client_id?: string; is_anonymous?: boolean; role?: string; amr?: Caller['amr'] }
  try {
    claims = (await jwtVerify(token, jwks.set, { issuer, audience: 'authenticated', algorithms: ['ES256'] })).payload
  } catch {
    return null
  }
  if (!claims.sub || claims.is_anonymous || claims.role !== 'authenticated') return null
  const clientId = claims.client_id ?? null
  return {
    userId: claims.sub,
    email: claims.email,
    clientId,
    product: clientId ? (env.APP_CLIENTS[clientId] ?? null) : null,
    amr: Array.isArray(claims.amr) ? claims.amr : []
  }
}
