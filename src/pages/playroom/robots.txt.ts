import { robotsTxt } from '../../lib/seo'

export const GET = (): Response => new Response(robotsTxt('playroom'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
