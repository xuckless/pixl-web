// The API behind /api/* on every host. Only crash reports are handled so
// far; accounts, checkout and licences answer 501 until they are built
// (TODO.md, "Accounts and licensing").

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

export async function handleApi(request: Request, url: URL): Promise<Response> {
  if (url.pathname === '/api/crash') return crash(request)
  return Response.json({ error: 'not_implemented' }, { status: 501 })
}
