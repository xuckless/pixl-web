// Search: each site's sitemap entries, and the structured data (schema.org
// JSON-LD) its pages carry. Facts only: no offers until checkout exists, no
// ratings we don't have.

import { canonical, origin } from './links'
import { SITES, type SiteId } from './sites'

/** The pages each site lists in its sitemap. Playroom's copies of the legal
    pages point their canonical at the company site's, so only those are listed;
    Space Pixl's are its own documents, so it lists them. */
export const SITEMAP: Record<SiteId, string[]> = {
  home: ['/', '/legal/', '/legal/beta/', '/legal/eula/', '/legal/privacy/', '/legal/third-party/'],
  playroom: ['/', '/beta/'],
  space: ['/', '/legal/eula/', '/legal/privacy/', '/legal/third-party/'],
  engine: ['/', '/pixlrgb/', '/hdr/', '/codecs/']
}

type Json = Record<string, unknown>

const ORG_ID = (): string => `${origin('home')}/#organization`

export function organization(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID(),
    name: 'PIXL Foundation',
    url: `${origin('home')}/`,
    logo: `${origin('home')}/logo.png`,
    email: 'hello@pixlfoundation.com',
    sameAs: ['https://github.com/xuckless']
  }
}

export function website(site: SiteId, description: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin(site)}/#website`,
    name: SITES[site].name,
    url: `${origin(site)}/`,
    description,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID() }
  }
}

export function softwareApp(
  site: 'playroom' | 'space' | 'engine',
  opts: { category: string; os: string; description: string; features?: string[] }
): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITES[site].name,
    url: `${origin(site)}/`,
    image: canonical(site, '/og.png'),
    applicationCategory: opts.category,
    operatingSystem: opts.os,
    description: opts.description,
    ...(opts.features ? { featureList: opts.features } : {}),
    publisher: { '@id': ORG_ID() }
  }
}

export function faqPage(items: { q: string; a: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  }
}

export function breadcrumbs(site: SiteId, trail: { name: string; path: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: canonical(site, t.path) }))
  }
}

/** JSON for a <script type="application/ld+json">, safe inside HTML. */
export function ldJson(data: Json): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/** A site's sitemap.xml. */
export function sitemapXml(site: SiteId, lastmod = new Date().toISOString().slice(0, 10)): string {
  const urls = SITEMAP[site]
    .map((p) => `  <url><loc>${canonical(site, p)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** A site's robots.txt: everything open, and where its sitemap is. */
export function robotsTxt(site: SiteId): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${canonical(site, '/sitemap.xml')}\n`
}
