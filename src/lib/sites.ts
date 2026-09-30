// The four sites this repo serves. Shared by the Worker (hostname → folder) and the
// pages (links between sites), so the two can't drift apart.

export type SiteId = 'home' | 'playroom' | 'space' | 'engine'

export interface Site {
  id: SiteId
  /** Subdomain label; '' is the apex. */
  sub: string
  /** Folder under dist/ (and src/pages/) the site's files live in. */
  dir: string
  name: string
}

export const SITES: Record<SiteId, Site> = {
  home: { id: 'home', sub: '', dir: 'home', name: 'PIXL Foundation' },
  playroom: { id: 'playroom', sub: 'playroom', dir: 'playroom', name: 'Pixl Playroom' },
  space: { id: 'space', sub: 'space', dir: 'space', name: 'Space Pixl' },
  engine: { id: 'engine', sub: 'engine', dir: 'engine', name: 'PIXL Engine' },
}

export const ROOT_DOMAIN = 'pixlfoundation.com'

/** Sites that carry the legal pages (/legal/…); the others link to the company site's. */
export const LEGAL_SITES: SiteId[] = ['home', 'playroom']

/** The pixl-media R2 bucket (video, anything that needs Range requests). See scripts/push-media.sh. */
export const MEDIA_ORIGIN = 'https://media.pixlfoundation.com'

/** Paths served as-is on every host: build output and assets the sites share. */
export const SHARED_PREFIXES = ['/_astro/', '/shared/']

/** Which site a subdomain label belongs to ('' or 'www' is the apex). */
export function siteForSub(sub: string): Site | undefined {
  if (sub === '' || sub === 'www') return SITES.home
  return Object.values(SITES).find((s) => s.sub === sub)
}
