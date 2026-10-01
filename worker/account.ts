// The PIXL account's API for the apps (TODO.md, "Contract with the apps"):
//   POST   /api/entitlements  check in: register this device, get a signed entitlement token
//   POST   /api/trials        start the 14-day trial, then the same answer
//   DELETE /api/devices/:id   free a device (from the app, or the account page)
// The decisions themselves are database functions (supabase/migrations/
// *_device_functions.sql), one transaction each.

import { caller, type AuthEnv, type Caller } from './auth'
import { entitlementToken, type Ent, type EntitlementEnv } from './entitlements'
import { rpc, type SupabaseEnv } from './supabase'

export interface AccountEnv extends AuthEnv, SupabaseEnv, EntitlementEnv {
  /** Hashes the apps' device hashes again before they are stored (a secret). */
  DEVICE_PEPPER?: string
  /** Account calls per user (and trial starts per IP) per minute. */
  ACCOUNT_LIMIT?: RateLimit
}

/** What check_in() and start_trial() answer. */
interface Holdings {
  error?: 'no_beta' | 'beta_ended' | 'device_limit' | 'trial_used_account' | 'trial_used_device'
  devices?: { id: string; name: string; lastSeen: number }[]
  ent?: Ent
  discount?: { code: string; expires: number } | null
}

const STATUS: Record<NonNullable<Holdings['error']>, number> = {
  no_beta: 403,
  beta_ended: 410,
  device_limit: 403,
  trial_used_account: 409,
  trial_used_device: 409
}

const MAX_BODY = 4 * 1024
const OS = ['macos', 'windows', 'linux']

const json = (status: number, body: unknown, headers: HeadersInit = {}): Response =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } })
const bad = (field: string): Response => json(400, { error: 'bad_request', field })

/** Too many calls: per user, and for trials per IP too. */
async function limited(env: AccountEnv, keys: string[]): Promise<Response | null> {
  if (!env.ACCOUNT_LIMIT) return null
  for (const key of keys) {
    if (!(await env.ACCOUNT_LIMIT.limit({ key })).success) return json(429, { error: 'too_many' }, { 'Retry-After': '60' })
  }
  return null
}

/** HMAC-SHA256(DEVICE_PEPPER, the app's hash), hex: what the database stores. */
async function pepper(env: AccountEnv, deviceHash: string): Promise<string> {
  if (!env.DEVICE_PEPPER) throw new Error('DEVICE_PEPPER is not set')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.DEVICE_PEPPER), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(deviceHash)))
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface CheckIn {
  product: string
  deviceHash: string
  deviceName: string
  os: string
  appVersion: string
}

/** The body every check-in sends, validated; or the 400 to answer. */
async function checkInBody(request: Request): Promise<CheckIn | Response> {
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return bad('body')
  const text = await request.text()
  if (text.length > MAX_BODY) return bad('body')
  let b: Record<string, unknown>
  try {
    b = JSON.parse(text) as Record<string, unknown>
  } catch {
    return bad('body')
  }
  if (typeof b !== 'object' || b === null) return bad('body')
  const str = (k: string): string => (typeof b[k] === 'string' ? (b[k] as string).trim() : '')
  const c: CheckIn = { product: str('product'), deviceHash: str('deviceHash'), deviceName: str('deviceName'), os: str('os'), appVersion: str('appVersion') }
  if (!/^[a-z]+$/.test(c.product)) return bad('product')
  if (!/^[0-9a-f]{64}$/.test(c.deviceHash)) return bad('deviceHash')
  if (!c.deviceName || c.deviceName.length > 100) return bad('deviceName')
  if (!OS.includes(c.os)) return bad('os')
  if (!/^[0-9A-Za-z.+-]{1,40}$/.test(c.appVersion)) return bad('appVersion')
  return c
}

/** Who may check in for this product: an app's own token, for its own product. */
async function appCaller(request: Request, env: AccountEnv, product: string): Promise<Caller | Response> {
  const who = await caller(request, env)
  if (!who) return json(401, { error: 'auth' })
  if (!who.product || who.product !== product) return json(403, { error: 'wrong_client' })
  return who
}

async function checkIn(request: Request, env: AccountEnv, fn: 'check_in' | 'start_trial'): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method' }, { Allow: 'POST' })
  const body = await checkInBody(request)
  if (body instanceof Response) return body
  const who = await appCaller(request, env, body.product)
  if (who instanceof Response) return who
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const slow = await limited(env, fn === 'start_trial' ? [`user:${who.userId}`, `trial-ip:${ip}`] : [`user:${who.userId}`])
  if (slow) return slow

  const h = await rpc<Holdings>(env, fn, {
    p_user: who.userId,
    p_product: body.product,
    p_hash: await pepper(env, body.deviceHash),
    p_name: body.deviceName,
    p_os: body.os,
    p_version: body.appVersion,
    p_beta_build: body.appVersion.includes('-beta')
  })
  if (h.error) {
    return json(STATUS[h.error], { error: h.error, ...(h.error === 'device_limit' ? { devices: h.devices ?? [] } : {}) })
  }
  const token = await entitlementToken(env, {
    userId: who.userId,
    email: who.email,
    product: body.product,
    deviceHash: body.deviceHash,
    ent: h.ent ?? { addons: [] },
    discount: h.discount
  })
  return json(200, { token, keyset: env.ENTITLEMENT_KEYSET ?? null })
}

/** Free a device. An app's token frees only its own product's devices. */
async function freeDevice(request: Request, env: AccountEnv, id: string): Promise<Response> {
  if (request.method !== 'DELETE') return json(405, { error: 'method' }, { Allow: 'DELETE' })
  if (!/^[0-9a-f-]{36}$/.test(id)) return bad('id')
  const who = await caller(request, env)
  if (!who) return json(401, { error: 'auth' })
  if (who.clientId && !who.product) return json(403, { error: 'wrong_client' })
  const slow = await limited(env, [`user:${who.userId}`])
  if (slow) return slow
  const freed = await rpc<boolean>(env, 'release_device', { p_user: who.userId, p_device: id, p_product: who.product })
  return freed ? new Response(null, { status: 204 }) : json(404, { error: 'not_found' })
}

/** The account routes, or null when the path isn't one of them. */
export async function handleAccount(request: Request, url: URL, env: AccountEnv): Promise<Response | null> {
  try {
    if (url.pathname === '/api/entitlements') return await checkIn(request, env, 'check_in')
    if (url.pathname === '/api/trials') return await checkIn(request, env, 'start_trial')
    const device = /^\/api\/devices\/([^/]+)$/.exec(url.pathname)
    if (device) return await freeDevice(request, env, device[1])
    return null
  } catch (e) {
    console.error('account api', url.pathname, (e as Error).message)
    return json(500, { error: 'server' })
  }
}
