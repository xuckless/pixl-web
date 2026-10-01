// The PIXL account's OAuth 2.1 server (Supabase pixl-core), end to end without a
// browser: what a desktop app does to sign in, with a throwaway user standing in
// for the person at the consent page.
//   node scripts/oauth-smoke.mts --register   create the apps' OAuth clients (APP_CLIENTS) if missing, print their ids
//   node scripts/oauth-smoke.mts              sign in as a throwaway user through the Playroom client, print
//                                             what comes back at each step, then delete the user
// Needs `supabase login` (the keys come from the Management API; see lib/supabase.mts).
import { createHash, randomBytes } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createRemoteJWKSet, decodeJwt, jwtVerify } from 'jose'
import { apiKeys, SUPABASE_URL } from './lib/supabase.mts'

/** One public client per app; the redirect URIs must match the app's exactly. */
const APP_CLIENTS = [
  {
    name: 'Pixl Playroom',
    redirect_uris: ['http://127.0.0.1:47823/callback', 'pixlplayroom://auth/callback']
  }
]

const AUTH = `${SUPABASE_URL}/auth/v1`
const { publishable, secret } = await apiKeys()
const admin = createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } })

const b64url = (b: Buffer): string => b.toString('base64url')
const log = (label: string, value: unknown): void => console.log(`\n# ${label}\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`)

// Fetched directly: supabase-js's listClients spreads the answer into an object, which
// loses a plain array.
async function clients(): Promise<{ client_id: string; client_name?: string; name?: string; redirect_uris: string[] }[]> {
  const res = await fetch(`${AUTH}/admin/oauth/clients`, { headers: { apikey: secret, Authorization: `Bearer ${secret}` } })
  if (!res.ok) throw new Error(`listing OAuth clients: HTTP ${res.status}: ${await res.text()}`)
  const body = (await res.json()) as { clients?: never[] } | never[]
  return Array.isArray(body) ? body : (body.clients ?? [])
}

async function register(): Promise<void> {
  const existing = await clients()
  for (const want of APP_CLIENTS) {
    const have = existing.find((c) => (c.client_name ?? c.name) === want.name)
    if (have) {
      log(`${want.name}: already registered`, { client_id: have.client_id, redirect_uris: have.redirect_uris })
      continue
    }
    // token_endpoint_auth_method 'none' is what makes it a public client (PKCE, no secret).
    const { data, error } = await admin.auth.admin.oauth.createClient({
      client_name: want.name,
      redirect_uris: want.redirect_uris,
      scope: 'openid email profile',
      token_endpoint_auth_method: 'none'
    })
    if (error) {
      log(`${want.name}: refused with every redirect URI`, error.message)
      // Which URI did it object to? Try each alone (a client per try, deleted again).
      for (const uri of want.redirect_uris) {
        const t = await admin.auth.admin.oauth.createClient({ client_name: `${want.name} (probe)`, redirect_uris: [uri], token_endpoint_auth_method: 'none' })
        log(`probe ${uri}`, t.error ? `refused: ${t.error.message}` : 'accepted')
        if (t.data) await admin.auth.admin.oauth.deleteClient(t.data.client_id)
      }
      continue
    }
    log(`${want.name}: registered`, data)
  }
}

/** A signed-in session for a new throwaway user, without an email or a CAPTCHA. */
async function throwawaySession(): Promise<{ user: string; site: SupabaseClient; access: string }> {
  const email = `oauth-smoke+${Date.now()}@pixlfoundation.com`
  const created = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (created.error) throw created.error
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (link.error) throw link.error
  const site = createClient(SUPABASE_URL, publishable, { auth: { persistSession: false, autoRefreshToken: false } })
  const verified = await site.auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties.hashed_token })
  if (verified.error || !verified.data.session) throw verified.error ?? new Error('no session')
  return { user: created.data.user.id, site, access: verified.data.session.access_token }
}

function authorizeUrl(clientId: string, redirectUri: string, challenge: string, state: string): string {
  const q = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'openid email profile'
  })
  return `${AUTH}/oauth/authorize?${q}`
}

async function token(body: Record<string, string>): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${AUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', apikey: publishable },
    body: new URLSearchParams(body)
  })
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> }
}

/** authorize → the consent page's authorization_id (or straight to the redirect, once consented). */
async function authorize(clientId: string, redirectUri: string, site: SupabaseClient) {
  const verifier = b64url(randomBytes(32))
  const challenge = b64url(createHash('sha256').update(verifier).digest())
  const state = b64url(randomBytes(16))
  const res = await fetch(authorizeUrl(clientId, redirectUri, challenge, state), { redirect: 'manual' })
  const location = res.headers.get('Location') ?? ''
  const authorizationId = location ? new URL(location).searchParams.get('authorization_id') : null
  if (!authorizationId) return { status: res.status, location, body: location ? '' : await res.text(), verifier, state }
  const details = await site.auth.oauth.getAuthorizationDetails(authorizationId)
  return { status: res.status, location, authorizationId, details, verifier, state }
}

async function smoke(): Promise<void> {
  const app = (await clients()).find((c) => (c.client_name ?? c.name) === APP_CLIENTS[0].name)
  if (!app) throw new Error(`${APP_CLIENTS[0].name} isn't registered: run with --register first`)
  const redirectUri = APP_CLIENTS[0].redirect_uris[0]
  const { user, site } = await throwawaySession()
  try {
    // 1. A redirect URI that differs only in the port: refused, or loopback-any-port (RFC 8252)?
    const otherPort = await authorize(app.client_id, redirectUri.replace(':47823', ':47824'), site)
    log('authorize with another loopback port', { status: otherPort.status, location: otherPort.location, body: otherPort.body?.slice(0, 300) })

    // 2. The real flow: authorize → consent page → approve → code.
    const first = await authorize(app.client_id, redirectUri, site)
    log('authorize → consent page', { status: first.status, location: first.location })
    log('getAuthorizationDetails (first time)', first.details)
    if (!first.authorizationId) throw new Error('no authorization_id')
    const approved = await site.auth.oauth.approveAuthorization(first.authorizationId, { skipBrowserRedirect: true })
    if (approved.error) throw approved.error
    const back = new URL(approved.data.redirect_url)
    log('approve → redirect', { redirect_url: `${back.origin}${back.pathname}`, state_matches: back.searchParams.get('state') === first.state })
    const code = back.searchParams.get('code')
    if (!code) throw new Error('no code')

    // 3. Code → tokens, with the PKCE verifier and no secret.
    const tokens = await token({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: app.client_id, code_verifier: first.verifier })
    log('code exchange', { status: tokens.status, keys: Object.keys(tokens.json), expires_in: tokens.json.expires_in, scope: tokens.json.scope, error: tokens.json.error })
    const access = String(tokens.json.access_token)
    log('access token claims', decodeJwt(access))
    if (tokens.json.id_token) log('id token claims', decodeJwt(String(tokens.json.id_token)))
    const jwks = createRemoteJWKSet(new URL(`${AUTH}/.well-known/jwks.json`))
    const verified = await jwtVerify(access, jwks, { issuer: AUTH, audience: 'authenticated' })
    log('access token verifies against the JWKS', { alg: verified.protectedHeader.alg, kid: verified.protectedHeader.kid })
    const replay = await token({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: app.client_id, code_verifier: first.verifier })
    log('the same code again', { status: replay.status, error: replay.json.error ?? replay.json.error_code })

    // 4. Refresh: does it rotate, and what does reusing the old token do?
    const rt1 = String(tokens.json.refresh_token)
    const r1 = await token({ grant_type: 'refresh_token', refresh_token: rt1, client_id: app.client_id })
    const rt2 = String(r1.json.refresh_token)
    log('refresh', { status: r1.status, rotated: rt2 !== rt1, client_id: r1.json.access_token ? decodeJwt(String(r1.json.access_token)).client_id : null })
    const quick = await token({ grant_type: 'refresh_token', refresh_token: rt1, client_id: app.client_id })
    log('old refresh token reused at once (reuse interval)', { status: quick.status, error: quick.json.error ?? quick.json.error_code })
    await new Promise((r) => setTimeout(r, 11_000))
    const late = await token({ grant_type: 'refresh_token', refresh_token: rt1, client_id: app.client_id })
    log('old refresh token reused after 11 s', { status: late.status, error: late.json.error ?? late.json.error_code, message: late.json.error_description ?? late.json.msg })
    const after = await token({ grant_type: 'refresh_token', refresh_token: rt2, client_id: app.client_id })
    log('the newest refresh token after that reuse', { status: after.status, error: after.json.error ?? after.json.error_code })
    const live = after.status === 200 ? String(after.json.refresh_token) : null

    // 5. A second sign-in: is consent skipped?
    const second = await authorize(app.client_id, redirectUri, site)
    log('getAuthorizationDetails (second time)', second.details)

    // 6. The account page's "Signed-in apps": list, then revoke.
    const grants = await site.auth.oauth.listGrants()
    log('listGrants', grants.data ?? grants.error?.message)
    const revoked = await site.auth.oauth.revokeGrant({ clientId: app.client_id })
    log('revokeGrant', revoked.error?.message ?? 'ok')
    if (live) {
      const gone = await token({ grant_type: 'refresh_token', refresh_token: live, client_id: app.client_id })
      log('refresh after revoking the grant', { status: gone.status, error: gone.json.error ?? gone.json.error_code })
    }

    // 7. The secret key on the admin API: as apikey alone, and as a bearer.
    for (const [label, headers] of [
      ['apikey only', { apikey: secret }],
      ['bearer only', { Authorization: `Bearer ${secret}` }]
    ] as const) {
      const r = await fetch(`${AUTH}/admin/users?per_page=1`, { headers })
      log(`admin API with the secret key, ${label}`, r.status)
    }
  } finally {
    await admin.auth.admin.deleteUser(user)
  }
}

if (process.argv.includes('--register')) await register()
else await smoke()
