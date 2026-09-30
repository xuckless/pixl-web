// One Worker serves all four sites. The hostname picks the site's folder in the
// static build, e.g. playroom.pixlfoundation.com/pricing → /playroom/pricing.
// Build output (/_astro/) and shared assets (/shared/) are served as-is on every host,
// and /api/* (worker/api.ts) answers on every host.

import { ROOT_DOMAIN, SHARED_PREFIXES, siteForSub } from '../src/lib/sites'
import { handleApi } from './api'

interface Env {
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
    const sub = subOf(host.split(':')[0])

    if (sub === 'www') {
      url.host = ROOT_DOMAIN
      return Response.redirect(url.toString(), 301)
    }

    if (url.pathname.startsWith('/api/')) return handleApi(request, url)

    if (SHARED_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return env.ASSETS.fetch(request)
    }

    const site = siteForSub(sub ?? '')
    if (!site) return notFound(env, request, 'home')

    const inner = new URL(url)
    inner.pathname = `/${site.dir}${url.pathname}`
    const res = await env.ASSETS.fetch(new Request(inner, request))
    if (res.status === 404) return notFound(env, request, site.dir)

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
    return res
  },
} satisfies ExportedHandler<Env>

async function notFound(env: Env, request: Request, dir: string): Promise<Response> {
  const page = await env.ASSETS.fetch(new Request(new URL(`/${dir}/404/`, request.url)))
  return new Response(page.body, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
