import { sitemapXml } from '../../lib/seo'

export const GET = (): Response => new Response(sitemapXml('playroom'), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
