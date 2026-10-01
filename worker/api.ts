// The API behind /api/* on every host: crash and problem reports, the Lemon
// Squeezy webhook, and the PIXL account's endpoints for the apps
// (worker/account.ts; the schema is in supabase/migrations/).

import { handleAccount, type AccountEnv } from './account'

export interface ApiEnv extends AccountEnv {
  /** Lemon Squeezy's webhook signing secret (`wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET`). */
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string
  /**
   * Where reports are kept (R2 bucket `pixl-reports`): crash/, minidump/ and
   * report/ by day, each prefix with a lifecycle rule that deletes it after
   * the retention period the privacy policy states. Unbound, reports are only
   * summarised in the logs, as before.
   */
  REPORTS?: R2Bucket
  /** Requests per client per minute, across /api/crash and /api/report. */
  REPORT_LIMIT?: RateLimit
}

/** The largest report accepted: a minidump is well under this. */
const MAX_REPORT_BYTES = 5 * 1024 * 1024
/** The largest problem report: the user's words, and the tail of the app's log. */
const MAX_PROBLEM_BYTES = 512 * 1024
const MAX_PROBLEM_TEXT = 5_000

/** `prefix/2026-10-01/…`: one folder a day, so lifecycle rules and browsing stay cheap. */
function reportKey(prefix: string, ext: string, id: string = crypto.randomUUID()): string {
  const now = new Date()
  return `${prefix}/${now.toISOString().slice(0, 10)}/${now.getTime()}-${id}.${ext}`
}

/** The body, or null when it is larger than `max` (Content-Length can be absent or wrong). */
async function bodyWithin(request: Request, max: number): Promise<ArrayBuffer | null> {
  if (Number(request.headers.get('Content-Length') ?? 0) > max) return null
  const body = await request.arrayBuffer()
  return body.byteLength > max ? null : body
}

/** Too many reports from one client: a loop that throws should not fill the bucket. */
async function limited(request: Request, env: ApiEnv): Promise<boolean> {
  if (!env.REPORT_LIMIT) return false
  const who = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  const { success } = await env.REPORT_LIMIT.limit({ key: who })
  return !success
}

/**
 * Crash reports from the apps, sent only by users who opted in: Electron's
 * crashReporter (multipart minidumps, from Crashpad, gzipped) and the apps'
 * own JSON error reports (pixl-playroom src/shared/crash.ts). Each is kept as
 * it came, in REPORTS, and summarised in the logs. Crashpad counts only a 200
 * as delivered and retries anything else, so a refusal it shouldn't retry
 * (too large, too many) still answers 200.
 */
async function crash(request: Request, env: ApiEnv): Promise<Response> {
  if (request.method !== 'POST') return new Response('POST a crash report', { status: 405, headers: { Allow: 'POST' } })
  const type = request.headers.get('Content-Type') ?? ''
  const json = type.startsWith('application/json')
  if (await limited(request, env)) {
    await request.body?.cancel()
    return new Response('too many reports', { status: json ? 429 : 200 })
  }
  const body = await bodyWithin(request, MAX_REPORT_BYTES)
  if (!body) return new Response('too large', { status: json ? 413 : 200 })
  if (json) {
    const r = (() => {
      try {
        return JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>
      } catch {
        return null
      }
    })()
    if (!r || typeof r !== 'object') return new Response('bad json', { status: 400 })
    const summary = { kind: r.kind, version: r.version, platform: r.platform, arch: r.arch, message: String(r.message ?? '').slice(0, 300) }
    console.log('crash report', JSON.stringify(summary))
    await env.REPORTS?.put(reportKey('crash', 'json'), body, {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { kind: String(r.kind ?? ''), version: String(r.version ?? ''), platform: String(r.platform ?? '') }
    })
  } else {
    // Kept whole (multipart, possibly gzipped): minidump-stackwalk reads it after unpacking.
    console.log('minidump', JSON.stringify({ type: type.split(';')[0], bytes: body.byteLength }))
    await env.REPORTS?.put(reportKey('minidump', 'multipart'), body, {
      httpMetadata: {
        contentType: type,
        ...(request.headers.get('Content-Encoding') ? { contentEncoding: request.headers.get('Content-Encoding')! } : {})
      }
    })
  }
  return new Response('received', { status: 200 })
}

/**
 * A problem report the user wrote and sent from the app (Settings → Report a
 * problem): what happened, an email if they want a reply, and optionally the
 * tail of the app's log, scrubbed of their home folder before it left. Kept
 * in REPORTS under report/; the answer carries a reference to quote.
 */
async function problem(request: Request, env: ApiEnv): Promise<Response> {
  if (request.method !== 'POST') return new Response('POST a report', { status: 405, headers: { Allow: 'POST' } })
  if (await limited(request, env)) {
    await request.body?.cancel()
    return Response.json({ error: 'too_many' }, { status: 429 })
  }
  const body = await bodyWithin(request, MAX_PROBLEM_BYTES)
  if (!body) return Response.json({ error: 'too_large' }, { status: 413 })
  let r: Record<string, unknown>
  try {
    r = JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>
  } catch {
    return Response.json({ error: 'bad_json' }, { status: 400 })
  }
  const message = typeof r.message === 'string' ? r.message.trim() : ''
  if (!message || message.length > MAX_PROBLEM_TEXT) return Response.json({ error: 'bad_message' }, { status: 400 })
  const email = typeof r.email === 'string' ? r.email.trim() : ''
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return Response.json({ error: 'bad_email' }, { status: 400 })
  }
  const id = crypto.randomUUID()
  const key = reportKey('report', 'json', id)
  /** What the user quotes if they write to us about it. */
  const reference = id.slice(0, 8).toUpperCase()
  if (env.REPORTS) {
    await env.REPORTS.put(key, JSON.stringify({ ...r, message, email: email || undefined, reference, receivedAt: new Date().toISOString() }), {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { reference, app: String(r.app ?? ''), version: String(r.version ?? ''), platform: String(r.platform ?? '') }
    })
  }
  console.log('problem report', JSON.stringify({ reference, app: r.app, version: r.version, platform: r.platform, email: Boolean(email), log: typeof r.log === 'string' ? r.log.length : 0 }))
  return Response.json({ reference }, { status: 200 })
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

/** Endpoints still to come; named here so the apps and the site can be written against them. */
const PLANNED: Record<string, string> = {
  '/api/account': 'deleting the account',
  '/api/checkout': 'a Lemon Squeezy checkout link for a product'
}

export async function handleApi(request: Request, url: URL, env: ApiEnv): Promise<Response> {
  if (url.pathname === '/api/crash') return crash(request, env)
  if (url.pathname === '/api/report') return problem(request, env)
  if (url.pathname === '/api/webhooks/lemonsqueezy') return lemonSqueezyWebhook(request, env)
  const account = await handleAccount(request, url, env)
  if (account) return account
  const planned = Object.entries(PLANNED).find(([p]) => url.pathname === p || url.pathname.startsWith(`${p}/`))
  return Response.json(
    { error: 'not_implemented', ...(planned ? { planned: planned[1] } : {}) },
    { status: 501 }
  )
}
