// One Worker serves all four sites. The hostname picks the site's folder in the
// static build, e.g. playroom.pixlfoundation.com/pricing → /playroom/pricing.
// Build output (/_astro/) and shared assets (/shared/) are served as-is on every host,
// and /api/* (worker/api.ts) answers on every host. Responses get cache lifetimes
// by type, and any host but the real domains is kept out of search results.

import { ROOT_DOMAIN, SHARED_PREFIXES, siteForSub } from '../src/lib/sites'
import { handleApi, type ApiEnv } from './api'
import { handleDownload } from './downloads'

interface Env extends ApiEnv {
  ASSETS: Fetcher
}

// Hosts a subdomain is read against. localhost is for `pnpm preview`
// (playroom.localhost:8787); any other host (workers.dev) gets the apex site.
const ROOTS = [ROOT_DOMAIN, 'localhost']

function subOf(hostname: string): string | undefined {
  for (const root of ROOTS) {
    if (hostname === root) return ''
    if (hostname.endsWith(`.${root}`)) return hostname.slice(0, -root.length - 1)
  }
  return undefined
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    // The Host header, not the URL: `wrangler dev` rewrites the URL to localhost.
    const host = request.headers.get('Host') ?? url.host
    const hostname = host.split(':')[0]
    const sub = subOf(hostname)
    // workers.dev and local previews serve the same pages: never let them be indexed.
    const noindex = sub === undefined || hostname === 'localhost' || hostname.endsWith('.localhost')
    const done = (res: Response): Response => finish(res, url.pathname, noindex)

    if (sub === 'www') {
      url.host = ROOT_DOMAIN
      return Response.redirect(url.toString(), 301)
    }

    if (url.pathname.startsWith('/api/')) return handleApi(request, url, env)
    if (sub === 'playroom' && url.pathname.startsWith('/download/')) return handleDownload(url)

    if (SHARED_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return done(await env.ASSETS.fetch(request))
    }

    const site = siteForSub(sub ?? '')
    if (!site) return done(await notFound(env, request, 'home'))

    const inner = new URL(url)
    inner.pathname = `/${site.dir}${url.pathname}`
    const res = await env.ASSETS.fetch(new Request(inner, request))
    if (res.status === 404) return done(await notFound(env, request, site.dir))

    // The assets binding redirects /playroom/x to /playroom/x/ for folders;
    // strip the folder back out of the Location so the public URL stays clean.
    const loc = res.headers.get('Location')
    if (loc && res.status >= 300 && res.status < 400) {
      const to = new URL(loc, inner)
      const prefix = `/${site.dir}`
      if (to.pathname.startsWith(prefix)) {
        to.pathname = to.pathname.slice(prefix.length) || '/'
        to.host = host
        to.protocol = url.protocol
        const headers = new Headers(res.headers)
        headers.set('Location', to.toString())
        return new Response(res.body, { status: res.status, headers })
      }
    }
    return done(res)
  },
} satisfies ExportedHandler<Env>

const YEAR = 'public, max-age=31536000, immutable'
const DAY = 'public, max-age=86400'

/** How long a browser and Cloudflare's cache may keep a response. */
function cacheFor(pathname: string, contentType: string): string {
  // Astro's build output carries a content hash in its name, and fonts never change.
  if (pathname.startsWith('/_astro/') || pathname.endsWith('.woff2')) return YEAR
  // Pages: always check for a newer one (a cheap 304 when nothing changed).
  if (contentType.startsWith('text/html')) return 'public, max-age=0, must-revalidate'
  // Images, video, press kits, the sitemap: a day, since their names don't change when they do.
  return DAY
}

/** Pages that act on the PIXL account: never inside another site's frame (clickjacking). */
const UNFRAMED = ['/account/', '/oauth/']

function finish(res: Response, pathname: string, noindex: boolean): Response {
  const headers = new Headers(res.headers)
  if (res.ok) headers.set('Cache-Control', cacheFor(pathname, headers.get('Content-Type') ?? ''))
  if (noindex) headers.set('X-Robots-Tag', 'noindex')
  if (UNFRAMED.some((p) => pathname.startsWith(p))) {
    headers.set('X-Frame-Options', 'DENY')
    headers.set('Content-Security-Policy', "frame-ancestors 'none'")
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

async function notFound(env: Env, request: Request, dir: string): Promise<Response> {
  const page = await env.ASSETS.fetch(new Request(new URL(`/${dir}/404/`, request.url)))
  return new Response(page.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
