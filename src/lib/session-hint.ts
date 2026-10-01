// Whether this browser holds a PIXL account session, read from the cookie's
// name alone: cheap enough for every page's nav, without loading supabase-js.
// It can be stale (an expired session still has its cookie); pages that need
// the truth ask Supabase (src/lib/auth.ts).

// supabase-js names it after the project: sb-<ref>-auth-token, in chunks .0, .1… when long.
const ref = new URL(import.meta.env.PUBLIC_SUPABASE_URL || 'https://lskosagqyekwklxyuczi.supabase.co').hostname.split('.')[0]
const COOKIE = `sb-${ref}-auth-token`

export function signedInHint(): boolean {
  return document.cookie.split(';').some((c) => {
    const name = c.trim().split('=')[0]
    return name === COOKIE || name === `${COOKIE}.0`
  })
}
