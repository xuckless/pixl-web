// Cloudflare Turnstile, which Supabase Auth requires with every request for an
// email code. One widget per form; each token works once, so the form asks for
// a fresh one (reset) after every use.

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, options: Record<string, unknown>): string
      reset(id: string): void
      remove(id: string): void
    }
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<void> | undefined

function load(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      loading = undefined
      reject(new Error('The security check could not load. Check your connection, or turn off anything blocking challenges.cloudflare.com.'))
    }
    document.head.append(s)
  })
  return loading
}

export interface Challenge {
  /** A token for the next request; waits for the check to pass. */
  token(): Promise<string>
  /** After a token is used: start a new check. */
  reset(): void
}

/** Turnstile in `el`, shown only when Cloudflare wants the visitor to interact. */
export async function challenge(el: HTMLElement, siteKey: string): Promise<Challenge> {
  await load()
  let current: string | null = null
  let waiting: ((t: string) => void)[] = []
  let failed: ((e: Error) => void)[] = []
  const id = window.turnstile!.render(el, {
    sitekey: siteKey,
    theme: 'dark',
    appearance: 'interaction-only',
    callback: (t: string) => {
      current = t
      waiting.forEach((w) => w(t))
      waiting = []
      failed = []
    },
    'expired-callback': () => {
      current = null
    },
    'error-callback': () => {
      failed.forEach((f) => f(new Error('The security check failed. Reload the page and try again.')))
      waiting = []
      failed = []
    }
  })
  return {
    token: () =>
      current
        ? Promise.resolve(current)
        : new Promise((resolve, reject) => {
            waiting.push(resolve)
            failed.push(reject)
          }),
    reset: () => {
      current = null
      window.turnstile!.reset(id)
    }
  }
}
