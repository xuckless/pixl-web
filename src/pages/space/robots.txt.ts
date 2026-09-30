import { robotsTxt } from '../../lib/seo'

export const GET = (): Response => new Response(robotsTxt('space'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
