// The API behind /api/* on every host: crash reports, the Lemon Squeezy
// webhook, and stubs for the account and licence endpoints still to come
// (TODO.md, "Accounts and licensing"; the draft schema is migrations/0001_accounts.sql).

export interface ApiEnv {
  /** Lemon Squeezy's webhook signing secret (`wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET`). */
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string
}

/** The largest report accepted: a minidump is well under this. */
const MAX_REPORT_BYTES = 5 * 1024 * 1024

/**
 * Crash reports from the apps, sent only by users who opted in: Electron's
 * crashReporter (multipart minidumps, from Crashpad) and the apps' own JSON
 * error reports (pixl-playroom src/shared/crash.ts). For now they are
 * acknowledged and summarised in the Worker's logs, and nothing is stored.
 * Crashpad counts only a 200 as delivered, and retries anything else.
 */
async function crash(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response('POST a crash report', { status: 405, headers: { Allow: 'POST' } })
  const length = Number(request.headers.get('Content-Length') ?? 0)
  if (length > MAX_REPORT_BYTES) return new Response('too large', { status: 413 })
  const type = request.headers.get('Content-Type') ?? ''
  if (type.startsWith('application/json')) {
    const r = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!r) return new Response('bad json', { status: 400 })
    console.log('crash report', JSON.stringify({ kind: r.kind, version: r.version, platform: r.platform, arch: r.arch, message: String(r.message ?? '').slice(0, 300) }))
  } else {
    console.log('minidump', JSON.stringify({ type: type.split(';')[0], bytes: length }))
    await request.body?.cancel()
  }
  return new Response('received', { status: 200 })
}

function hexBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null
  return new Uint8Array(hex.match(/../g)!.map((b) => parseInt(b, 16)))
}

/**
 * Lemon Squeezy's webhooks (order_created, license_key_created, and so on):
 * the signature is checked, the event logged and acknowledged. Storing
 * orders, keys and customers against accounts comes with the account system.
 */
async function lemonSqueezyWebhook(request: Request, env: ApiEnv): Promise<Response> {
  if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: { Allow: 'POST' } })
  const secret = env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) return new Response('webhook not configured', { status: 503 })
  const body = await request.arrayBuffer()
  const signature = hexBytes(request.headers.get('X-Signature') ?? '')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  // HMAC-SHA256 of the raw body, hex, in X-Signature; verify() compares in constant time.
  if (!signature || !(await crypto.subtle.verify('HMAC', key, signature, body))) {
    return new Response('bad signature', { status: 401 })
  }
  const event = JSON.parse(new TextDecoder().decode(body)) as { meta?: { event_name?: string; test_mode?: boolean }; data?: { id?: string; type?: string } }
  console.log('lemon squeezy', JSON.stringify({ event: event.meta?.event_name, test: event.meta?.test_mode, type: event.data?.type, id: event.data?.id }))
  return new Response('ok', { status: 200 })
}

/** Endpoints the account system will answer; named here so the apps and the site can be written against them. */
const PLANNED: Record<string, string> = {
  '/api/account': 'the signed-in account: email, licences',
  '/api/checkout': 'a Lemon Squeezy checkout link for a product',
  '/api/licences': "the account's licence keys",
  '/api/devices': "a licence's active devices, and deactivating one"
}

export async function handleApi(request: Request, url: URL, env: ApiEnv): Promise<Response> {
  if (url.pathname === '/api/crash') return crash(request)
  if (url.pathname === '/api/webhooks/lemonsqueezy') return lemonSqueezyWebhook(request, env)
  const planned = Object.entries(PLANNED).find(([p]) => url.pathname === p || url.pathname.startsWith(`${p}/`))
  return Response.json(
    { error: 'not_implemented', ...(planned ? { planned: planned[1] } : {}) },
    { status: 501 }
  )
}
