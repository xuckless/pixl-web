// The account API (worker/account.ts) against the contract with the apps,
// end to end: a throwaway user signs in through the Playroom OAuth client (as
// the app does), then checks in, hits the device limit, frees a device and
// starts a trial. The user is deleted afterwards.
//   node scripts/account-smoke.mts                          against `pnpm preview` (localhost:8787)
//   node scripts/account-smoke.mts https://pixlfoundation.com
// Needs `supabase login`. Exits non-zero at the first check that fails.
import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { decodeJwt, decodeProtectedHeader, importJWK, jwtVerify } from 'jose'
import { apiKeys, SUPABASE_URL } from './lib/supabase.mts'

const BASE = process.argv[2] ?? 'http://localhost:8787'
const PLAYROOM = '83eab600-baf2-4f5e-aac4-252010db94b2'
const REDIRECT = 'http://127.0.0.1:47823/callback'
const AUTH = `${SUPABASE_URL}/auth/v1`
const { publishable, secret } = await apiKeys()
const admin = createClient(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } })

let failures = 0
function check(label: string, ok: boolean, detail: unknown = ''): void {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: ${JSON.stringify(detail)}`}`)
  if (!ok) failures++
}

/** A throwaway user's site session and an app token from the Playroom client. */
async function signIn(): Promise<{ id: string; site: string; app: string }> {
  const email = `account-smoke+${Date.now()}@pixlfoundation.com`
  const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
  if (error) throw error
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const site = createClient(SUPABASE_URL, publishable, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data } = await site.auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties!.hashed_token })
  const verifier = randomBytes(32).toString('base64url')
  const q = new URLSearchParams({
    response_type: 'code', client_id: PLAYROOM, redirect_uri: REDIRECT, state: 's',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256', scope: 'openid email profile'
  })
  const loc = (await fetch(`${AUTH}/oauth/authorize?${q}`, { redirect: 'manual' })).headers.get('Location')!
  const authorizationId = new URL(loc).searchParams.get('authorization_id')!
  // Reading the request first is what ties it to this user (the consent page does the same).
  await site.auth.oauth.getAuthorizationDetails(authorizationId)
  const approved = await site.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
  if (!approved.data) {
    await admin.auth.admin.deleteUser(created.user.id)
    throw approved.error ?? new Error('approval failed')
  }
  const code = new URL(approved.data!.redirect_url).searchParams.get('code')!
  const tok = await fetch(`${AUTH}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', apikey: publishable },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT, client_id: PLAYROOM, code_verifier: verifier })
  })
  return { id: created.user.id, site: data.session!.access_token, app: ((await tok.json()) as { access_token: string }).access_token }
}

async function call(method: string, path: string, token: string | null, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  })
  const text = await res.text()
  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(text) as Record<string, unknown>
  } catch {
    // no body (204)
  }
  return { status: res.status, json, headers: res.headers }
}

const device = (n: number) => createHash('sha256').update(`smoke-device-${n}-${Date.now()}`).digest('hex')
const checkInBody = (hash: string, version = '1.0.0', extra: Record<string, unknown> = {}) => ({
  product: 'playroom', deviceHash: hash, deviceName: `Smoke ${hash.slice(0, 4)}`, os: 'macos', appVersion: version, ...extra
})

/** The token verifies with the key the key set lists for its kid. */
async function verifyToken(token: string, keyset: string, deviceHash: string) {
  const keys = (decodeJwt(keyset) as { keys: Record<string, string> }).keys
  const { kid, typ } = decodeProtectedHeader(token)
  const x = keys[kid ?? '']
  if (!x) return { ok: false, why: `kid ${kid} not in the key set` }
  const { payload } = await jwtVerify(token, await importJWK({ kty: 'OKP', crv: 'Ed25519', x }, 'EdDSA'), { issuer: 'pixlfoundation.com', audience: 'playroom' })
  const p = payload as { dev: string; iat: number; exp: number; rfa: number }
  const ok = typ === 'JWT' && p.dev === deviceHash && p.exp - p.iat === 30 * 86400 && p.rfa - p.iat === 86400
  return { ok, why: { typ, ...p } }
}

const user = await signIn()
try {
  const d = [1, 2, 3, 4].map(device)

  // Who may call.
  check('no token → 401 auth', (await call('POST', '/api/entitlements', null, checkInBody(d[0]))).json.error === 'auth')
  check('garbage token → 401 auth', (await call('POST', '/api/entitlements', 'not.a.token', checkInBody(d[0]))).status === 401)
  const siteTry = await call('POST', '/api/entitlements', user.site, checkInBody(d[0]))
  check("a site session's token → 403 wrong_client", siteTry.status === 403 && siteTry.json.error === 'wrong_client', siteTry)
  const spaceTry = await call('POST', '/api/entitlements', user.app, checkInBody(d[0], '1.0.0', { product: 'space' }))
  check("Playroom's client asking for Space → 403 wrong_client", spaceTry.json.error === 'wrong_client', spaceTry)
  const badHash = await call('POST', '/api/entitlements', user.app, checkInBody('XYZ'))
  check('a bad deviceHash → 400 bad_request, field', badHash.status === 400 && badHash.json.field === 'deviceHash', badHash)
  check('not JSON → 400', (await call('POST', '/api/entitlements', user.app, '{nope')).status === 400)

  // Holding nothing: a token that says so.
  const empty = await call('POST', '/api/entitlements', user.app, checkInBody(d[0]))
  check('nothing held → 200 { token, keyset }', empty.status === 200 && typeof empty.json.token === 'string' && typeof empty.json.keyset === 'string', empty)
  if (empty.status === 200) {
    const v = await verifyToken(String(empty.json.token), String(empty.json.keyset), d[0])
    check('the token verifies (key set, aud, dev, 30 d, refresh after 1 d)', v.ok, v.why)
    check('nothing held → ent is { addons: [] }', JSON.stringify(decodeJwt(String(empty.json.token)).ent) === '{"addons":[]}', decodeJwt(String(empty.json.token)).ent)
  }
  const noBeta = await call('POST', '/api/entitlements', user.app, checkInBody(d[0], '0.2.0-beta.1'))
  check('a beta build without beta → 403 no_beta', noBeta.status === 403 && noBeta.json.error === 'no_beta', noBeta)

  // With beta access: three devices, then the limit.
  await admin.from('entitlements').insert({ user_id: user.id, product: 'playroom', kind: 'beta', program_id: 'playroom-beta' })
  for (const h of d.slice(0, 3)) {
    const r = await call('POST', '/api/entitlements', user.app, checkInBody(h, '0.2.0-beta.1'))
    check(`beta device ${h.slice(0, 4)} → 200 with ent.beta`, r.status === 200 && 'beta' in (decodeJwt(String(r.json.token)).ent as object), r)
  }
  const fourth = await call('POST', '/api/entitlements', user.app, checkInBody(d[3], '0.2.0-beta.1'))
  const listed = (fourth.json.devices ?? []) as { id: string; name: string; lastSeen: number }[]
  check('a fourth device → 403 device_limit with the three', fourth.status === 403 && fourth.json.error === 'device_limit' && listed.length === 3, fourth)

  // Free one from the app, then the fourth fits.
  if (listed[0]) {
    const freed = await call('DELETE', `/api/devices/${listed[0].id}`, user.app)
    check('DELETE /api/devices/:id → 204', freed.status === 204, freed)
    const again = await call('DELETE', `/api/devices/${listed[0].id}`, user.app)
    check('freeing it again → 404', again.status === 404, again)
  }
  const fits = await call('POST', '/api/entitlements', user.app, checkInBody(d[3], '0.2.0-beta.1'))
  check('then the fourth → 200', fits.status === 200, fits)

  // A trial, idempotent while it runs.
  const trial = await call('POST', '/api/trials', user.app, checkInBody(d[3]))
  const until = (decodeJwt(String(trial.json.token ?? 'e30.e30.')).ent as { trial?: { until: number } })?.trial?.until ?? 0
  check('POST /api/trials → 200 with a 14-day trial', trial.status === 200 && until > Date.now() / 1000 + 13.9 * 86400, trial)
  const trial2 = await call('POST', '/api/trials', user.app, checkInBody(d[3]))
  check('again while it runs → 200, same trial', trial2.status === 200 && (decodeJwt(String(trial2.json.token)).ent as { trial: { until: number } }).trial.until === until, trial2)
} finally {
  // Its trial's device record would outlive the account (by design); this one's made up.
  await admin.from('trial_devices').delete().eq('user_id', user.id)
  await admin.auth.admin.deleteUser(user.id)
}
console.log(failures ? `\n${failures} failed` : '\nall passed')
process.exit(failures ? 1 : 0)
