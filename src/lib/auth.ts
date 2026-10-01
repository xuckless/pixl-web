// The PIXL account in the browser: one Supabase client per page, its session
// in a cookie every PIXL site can read (Domain=.pixlfoundation.com), so being
// signed in on pixlfoundation.com also counts on playroom.pixlfoundation.com.
// Pages only: the Worker checks tokens itself (worker/api.ts).

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { ROOT_DOMAIN } from './sites'

// Public values (the publishable key is meant to be in pages); a build can point elsewhere.
export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://lskosagqyekwklxyuczi.supabase.co'
const PUBLISHABLE_KEY = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_1ozNwiLZxZLPZO3LEK5LHw_9VVf6A7G'
export const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFK_346N2pRbOtxq'

/** Our own apps' OAuth clients: the consent page approves these without asking. */
export const FIRST_PARTY_CLIENTS: Record<string, string> = {
  '83eab600-baf2-4f5e-aac4-252010db94b2': 'Pixl Playroom'
}

/** The host the build serves (pixlfoundation.com, or localhost for `pnpm preview`), without its port. */
const rootHost = (import.meta.env.PUBLIC_ROOT_DOMAIN || ROOT_DOMAIN).split(':')[0]

/**
 * Where the session cookie lives: every PIXL site on the real domain; the one
 * host anywhere else (browsers refuse Domain=localhost, so `pnpm preview`'s
 * subdomains each sign in on their own).
 */
export function cookieDomain(hostname: string): string | undefined {
  return hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`) ? `.${ROOT_DOMAIN}` : undefined
}

export type Supabase = SupabaseClient<Database>

let client: Supabase | undefined

/** The page's Supabase client. It picks up a Google or Apple sign-in coming back in the URL. */
export function supabase(): Supabase {
  client ??= createBrowserClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    cookieOptions: {
      domain: cookieDomain(location.hostname),
      path: '/',
      sameSite: 'lax',
      secure: location.protocol === 'https:'
    }
  })
  return client
}

/**
 * `raw` if it is a safe place to send someone after signing in: a path on this
 * site, or a page on a PIXL site. Anything else (another domain, `//evil`,
 * `javascript:`) gets `fallback`.
 */
export function safeNext(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.includes('\\')) return raw
  try {
    const url = new URL(raw)
    if (url.origin === location.origin) return url.href
    const local = rootHost === 'localhost'
    const ours = url.hostname === rootHost || url.hostname.endsWith(`.${rootHost}`)
    if (ours && (url.protocol === 'https:' || (local && url.protocol === 'http:'))) return url.href
  } catch {
    // not a URL
  }
  return fallback
}

/** A call to this site's /api/* (the Worker) as the signed-in user. */
export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase().auth.getSession()
  const headers = new Headers(init.headers)
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return fetch(path, { ...init, headers })
}

/** An error Supabase put in the URL after a Google or Apple sign-in, removed from the address bar. */
export function errorFromUrl(): string | null {
  const url = new URL(location.href)
  const hash = new URLSearchParams(url.hash.slice(1))
  const message = url.searchParams.get('error_description') ?? hash.get('error_description')
  if (!message) return null
  for (const k of ['error', 'error_code', 'error_description']) url.searchParams.delete(k)
  history.replaceState(history.state, '', `${url.pathname}${url.search}`)
  return message.replace(/\+/g, ' ')
}

/**
 * Runs `then` once the sign-in form (components/account/SignIn.astro) inside
 * `scope` has a signed-in visitor, including when it already did before this
 * was called (the form's script can finish first).
 */
export function onSignedIn(scope: HTMLElement, then: (email: string) => void): void {
  const form = scope.querySelector<HTMLElement>('[data-signin]')
  if (form?.dataset.signedIn !== undefined) return then(form.dataset.signedIn)
  scope.addEventListener('pixl:signed-in', (e) => then((e as CustomEvent<{ email?: string }>).detail.email ?? ''), { once: true })
}
