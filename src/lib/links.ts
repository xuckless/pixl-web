import { ROOT_DOMAIN, SITES, type SiteId } from './sites'

// In `astro dev` there is no Worker, so every site is reached through its folder
// (/playroom/…). A build is served by the Worker, which maps each subdomain to its
// folder, so links are absolute across sites and root-relative within one.
// PUBLIC_ROOT_DOMAIN points a build at another host, e.g. localhost:8787 for
// `pnpm preview` (playroom.localhost:8787 resolves to this machine).

const root: string = import.meta.env.PUBLIC_ROOT_DOMAIN || ROOT_DOMAIN
const scheme = root.startsWith('localhost') ? 'http' : 'https'

export function origin(site: SiteId): string {
  const sub = SITES[site].sub
  return `${scheme}://${sub ? `${sub}.` : ''}${root}`
}

/** A link to `path` on `site`, written from a page on `from`. */
export function href(site: SiteId, path = '/', from?: SiteId): string {
  const p = path.startsWith('/') || path.startsWith('#') ? path : `/${path}`
  if (import.meta.env.DEV) return p.startsWith('#') ? p : `/${SITES[site].dir}${p}`
  if (from === site) return p
  return `${origin(site)}${p.startsWith('#') ? `/${p}` : p}`
}

/** The public URL of a page, for canonical and Open Graph tags. */
export function canonical(site: SiteId, path = '/'): string {
  return `${origin(site)}${path}`
}
