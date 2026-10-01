interface ImportMetaEnv {
  /** Serve the build from another host, e.g. localhost:8787 for `pnpm preview`. */
  readonly PUBLIC_ROOT_DOMAIN?: string
  /** The PIXL account's Supabase project (src/lib/auth.ts has pixl-core's as defaults). */
  readonly PUBLIC_SUPABASE_URL?: string
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
  /** Cloudflare Turnstile's site key for the sign-in form. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string
}
