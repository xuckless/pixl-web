# TODO: pixl-web

Grouped by area; roughly in priority order within each.

**Top priority (2026-10-01)**: the PIXL account, the open beta, billing and
updates (the next four sections) come before everything else here. Playroom
can't ship a build until they work (pixl-playroom TODO, Phase C). Start
with the redirect-URI spike under "PIXL account".

## PIXL account (every app) — top priority

Decided 2026-10-01, with the app side in pixl-playroom's TODO (Phase C). One
account for every PIXL app, as JetBrains does:

- **Supabase Auth** is the identity provider and an **OAuth 2.1 server**.
  Each desktop app is a public client (authorization code with PKCE). The
  sites sign in with supabase-js.
- **Supabase Postgres** holds accounts, entitlements (beta, trial, licence,
  add-on subscriptions), devices and trials (`supabase/migrations/`,
  `supabase/README.md`).
- **The Worker** (`worker/api.ts`) is the API: it checks Supabase JWTs,
  takes Lemon Squeezy's webhooks and signs entitlement tokens for the apps.
- **Lemon Squeezy** handles checkout, billing, tax and refunds only. Pay
  once, US$69.99, 3 devices; the 14-day trial needs an account but no card.
  Refunds follow each country's legal minimum.
- **Sign-in**: an email code, Google or Apple, on Supabase's own domain
  for now (a custom auth domain can come later). The project is `pixl-core`
  (`lskosagqyekwklxyuczi`, "pixl" org, Pro, ca-central-1).
- **The beta** is open to anyone, with 3 devices. Testers' discount codes
  must be redeemed within 90 days of 1.0.

Done so far:

- [x] `/api/webhooks/lemonsqueezy` checks the `X-Signature` HMAC and logs the
      event (`worker/api.ts`). Set the secret with
      `wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET` and point the store's
      webhook at `https://pixlfoundation.com/api/webhooks/lemonsqueezy`.
- [x] `/account/` explains licences until accounts exist; the app's "Manage
      devices" link goes there.

Next:

- [x] **Spike**: Supabase's OAuth server with a desktop client, done
      2026-10-01 with `node scripts/oauth-smoke.mts`, which signs a throwaway
      user in through the Playroom client without a browser and deletes it
      again. Findings:
  - Both redirect URIs are accepted, `http://127.0.0.1:47823/callback` and
    `pixlplayroom://auth/callback`. Matching is exact: another loopback port
    gets 400 `invalid redirect_uri`.
  - `/oauth/authorize` redirects to
    `https://pixlfoundation.com/oauth/consent?authorization_id=…` (the
    authorization path, already set). After `approveAuthorization`, it
    redirects to the app's URI with `code` and the app's `state`.
  - `/oauth/token`, form-encoded with `client_id` and `code_verifier` (no
    secret), returns `access_token`, `refresh_token`, `id_token` and
    `expires_in` 3600. A code works once.
  - Access-token claims: `iss` `https://lskosagqyekwklxyuczi.supabase.co/auth/v1`,
    `aud` `authenticated`, `sub`, `email`, `session_id`, `client_id`,
    `scope`, and `amr` `[{method: "oauth_provider/authorization_code"}]`.
    ES256, and it verifies against `/auth/v1/.well-known/jwks.json`. A site
    session's token has no `client_id`.
  - Refresh rotates the refresh token every time. Reusing an old one still
    worked 11 s later (the reuse interval is 10 s), so reuse doesn't revoke
    anything; don't count on it.
  - After the first consent, `getAuthorizationDetails` returns only a
    `redirect_url`, so consent isn't asked again. Our consent page approves
    first-party clients outright anyway.
  - supabase-js `auth.oauth.listGrants()` and `revokeGrant({ clientId })`
    work with a site session. After a revoke, the app's refresh fails with
    400 `refresh_token_not_found`. Access tokens already issued last until
    they expire, which is at most an hour.
  - The secret key (`sb_secret_…`) works on the admin API as the `apikey`
    header. As a `Bearer` token alone it gets 401.
- [x] OAuth clients (`node scripts/oauth-smoke.mts --register`):
  - "Pixl Playroom", `83eab600-baf2-4f5e-aac4-252010db94b2`: public, scopes
    `openid email profile`, the two redirect URIs above. One client serves
    dev and production, since the app's redirect is the same in both.
  - Redirects allowed now also include `http://*.localhost:8787/**`, for
    `pnpm preview`'s subdomains.
- [x] Project settings, done 2026-10-01 through the Management API:
  - Site URL `https://pixlfoundation.com`. Redirects allowed: the company
    and Playroom sites, plus `localhost:4321` and `localhost:8787`.
  - Mail through Resend's SMTP (a send-only key), from
    `PIXL <noreply@pixlfoundation.com>`. Resend's DNS records came from its
    Cloudflare integration; DMARC is `p=none` for now.
  - Sign-in and sign-up emails carry a 6-digit code (`{{ .Token }}`) that
    lasts 10 minutes.
  - Cloudflare Turnstile is on as the CAPTCHA: widget "PIXL account
    sign-in", site key `0x4AAAAAAFK_346N2pRbOtxq`, allowed on
    pixlfoundation.com, playroom… and localhost. The secret is kept only in
    Supabase. The sign-in page must send a Turnstile token with every
    email-code request.
  - ES256 signing keys and the OAuth server were already on.
  - Minimum password length 12. The pages offer no password sign-in, but
    Supabase's email provider still accepts one through the API.
- [x] Google and Apple sign-in are on (2026-10-01). Both use the callback
      `https://lskosagqyekwklxyuczi.supabase.co/auth/v1/callback`. Apple's
      client secret expires 2027-03-30; renew it with
      `node scripts/apple-client-secret.mts --apply`.
- [ ] Still to set: DMARC at `p=quarantine` once mail flows cleanly.
- [x] Schema, in `supabase/migrations/` and pushed to pixl-core 2026-10-01
      (`supabase/README.md` covers changing it and the admin SQL):
  - `profiles`: made by a trigger for every new account, named from
    Google or Apple. Users may change `display_name` and `marketing_opt_in`
    from the site only, not with an app's token.
  - `programs`: seeded with `playroom-beta`, open, no cap, terms `2026-10`.
  - `entitlements`, `devices`, `trial_devices`, `agreements`,
    `webhook_events` and `discount_codes`.
  - RLS on every table. Users read their own rows, but not device hashes.
    `trial_devices` and `webhook_events` are the Worker's alone. No default
    grants.
  - `supabase/tests/rls.sql` checks all of this inside a rolled-back
    transaction.
  - Admin views and functions are in schema `admin` (beta testers,
    product-news contacts, shared devices, set and end a program).
- [x] Disposable email domains are refused at sign-up: the "Before User
      Created" hook checks 9,189 domains
      (`node scripts/disposable-domains.mts` refreshes them).
- [x] Checked end to end on the sign-in page: a mailinator address gets
      "Please use a permanent email address".
- [x] `/account/sign-in/` (`src/components/account/SignIn.astro`, which the
      beta page will embed; `src/lib/auth.ts`):
  - an email code with Turnstile, or Google, or Apple. Signing in creates
    the account.
  - Afterwards it goes to `?next=` if that's a PIXL page, otherwise to
    `/account/`.
  - The session is a cookie on `.pixlfoundation.com`, so every site's nav
    shows "Account" instead of "Sign in". On localhost the cookie belongs
    to its one host.
  - `/account/*` and `/oauth/*` refuse to be framed.
  - Tested in Chrome against `pnpm preview`: the code arrives and signs in,
    hostile `next` values fall back, and Google and Apple hand off.
    Turnstile refuses automated browsers unless Chrome's automation flags
    are off.
- [x] `/oauth/consent/`, where an app's sign-in lands:
  - Signed out, it goes to sign-in and comes back.
  - For our own apps (`FIRST_PARTY_CLIENTS` in `src/lib/auth.ts`) there's
    no consent screen. Fresh from signing in it approves at once. With a
    session already in the browser it takes one click on "Continue" (with
    "Use another account"), so an app never quietly gets an account
    nobody chose.
  - Other apps get Allow or Deny, with their scopes in words.
  - Supabase answers the consent calls only from the Site URL's origin
    (`https://pixlfoundation.com`), so the page works only there. Tested
    locally by proxying those calls (approve, then the code exchanges;
    deny gives `access_denied`; an unknown id is explained).
- [ ] Deploy, then sign in once from a real app build (handoff (b) to the
      Playroom session).
- [x] `/account/`, which signs out visitors through sign-in and back:
  - Products: beta, trial and licence, ended ones too, plus a tester's
    discount code.
  - Devices, with "Free this device" (`DELETE /api/devices/:id`).
  - Signed-in apps, with "Revoke".
  - Profile: name and the product-news opt-in.
  - Email change: Supabase's secure change, so codes go to both
    addresses.
  - "Sign out" and "Sign out everywhere".
  - Delete account: type the email, then a fresh email code. Then
    `DELETE /api/account` checks for a site session (not an app's) with a
    sign-in in the last 10 minutes.
  - Tested in Chrome: the lists, profile save, freeing a device, revoking
    an app, and the delete endpoint's rules. The email-change and delete
    code steps weren't run, because of the email limit below.
  - Receipts through Lemon Squeezy's customer portal come with billing.
- [ ] **Raise Supabase's email rate limit** before anyone signs up:
      `rate_limit_email_sent` is 2 an hour for the whole project
      (Supabase's default). Every sign-in code counts, so a third person in
      an hour gets "email rate limit exceeded". Set it to what the Resend
      plan allows.
- [x] Worker API (`worker/account.ts`, `auth.ts`, `entitlements.ts`,
      `supabase.ts`), as in "Contract with the apps":
  - It checks Supabase access tokens against the JWKS (`jose`). An app's
    `client_id` must map to the product it asks for (`APP_CLIENTS` in
    `wrangler.jsonc`).
  - `POST /api/entitlements` and `POST /api/trials` sign the entitlement
    token with Ed25519 and send the root-signed key set beside it.
  - `DELETE /api/devices/:id`.
  - The decisions are database functions, one transaction each
    (`check_in`, `start_trial`, `release_device`, `account_holdings`;
    `supabase/tests/devices.sql`).
  - Device hashes are peppered again before they're stored.
  - Rate limit `ACCOUNT_LIMIT`: 30 a minute per user, plus per IP for
    trials.
  - `node scripts/account-smoke.mts [base URL]` runs the contract end to
    end with a throwaway user; all checks pass against `pnpm preview`.
  - Locally: `node scripts/entitlement-key.mts dev-2026-10 --dev-vars`
    writes `.dev.vars`, with a key set signed by Playroom's development
    root.
- [ ] Production secrets, before the deploy that hands (c) to the Playroom
      session:
  - `SUPABASE_SECRET_KEY` and `DEVICE_PEPPER` (32 random bytes; never
    change it, or every device counts as new).
  - `node scripts/entitlement-key.mts ent-2026-10 --put`, which stores
    the signing key and prints `ent-2026-10=<public>`.
  - The owner signs the key set with the offline root:
    `node scripts/entitlement-keys.mjs sign-keyset root-1 ent-2026-10=<public>`
    in pixl-playroom. Its output goes in `ENTITLEMENT_KEYSET`.
- [ ] Trial abuse:
  - a verified email and Turnstile to sign up
  - disposable-email domains refused (done: the sign-up hook)
  - sign-ups rate-limited per IP (a Workers rate limit binding, plus
    Supabase's own auth limits)
  - one trial per account _and_ per device per product
  - flag a device hash that turns up on many accounts
- [ ] Privacy policy: the account, the hashed device id, the entitlement
      checks (with the lawyer, under Legal).
- [ ] Later: Space Pixl as a second OAuth client, once it sells anything.

### Contract with the apps

Agreed 2026-10-01 with the pixl-playroom session that builds Pass 25/26 (it
mirrors this in its `src/shared/account.ts`). Change it only together with
the app.

- **Sign-in**:
  - OAuth 2.1, authorization code with PKCE S256, through the system
    browser to `http://127.0.0.1:47823/callback`. The app runs a one-shot
    server on that port only while signing in.
  - Client "Pixl Playroom" (above), scopes `openid email profile`.
  - `/oauth/consent` approves our own clients without a screen. A
    signed-out visitor goes through `/account/sign-in/?next=<consent URL>`
    and back.
- **Endpoints**:
  - Every endpoint takes `Authorization: Bearer <Supabase access token>`.
  - The Worker checks `iss`, `aud` `authenticated`, and that the token's
    `client_id` belongs to the product asked for.
  - `POST /api/entitlements`
    `{ product, deviceHash, deviceName, os: "macos"|"windows", appVersion }`
    → 200 `{ token, keyset }`. It registers the device, or updates its name, os,
    version and last seen. It never counts the same device twice, and a
    freed device registers again if there's room.
  - `POST /api/trials`, same body → the same answer. It's idempotent: an
    active trial just returns the token.
  - `DELETE /api/devices/:id` frees a device; the app may call it too. The
    id is a device row's uuid, as listed in `device_limit`.
- **deviceHash**:
  - Lowercase hex HMAC-SHA256: key `pixl:<product>:device:v1`, message the
    OS machine id (IOPlatformUUID on macOS, MachineGuid on Windows).
  - The server checks `^[0-9a-f]{64}$`, and stores it HMAC'd again with
    the Worker secret `DEVICE_PEPPER`.
- **Token**:
  - A compact JWS, header `{ alg: "EdDSA", kid, typ: "JWT" }`, signed with
    Ed25519.
  - Payload, in unix seconds: `{ iss: "pixlfoundation.com", sub, aud:
    product, dev: deviceHash, iat, exp: iat + 30 d, rfa: iat + 1 d, email?,
    ent: { beta?: { until? }, trial?: { until }, licence?: { since },
    addons: [] }, discount?: { code, expires } }`.
  - `exp` is the offline grace and `rfa` is "refresh after".
  - Keys rotate without an app release (agreed later on 2026-10-01):
    - The app has only a root public key built in (kid `root-1`, with a
      spare `root-2`). The owner keeps the root private keys offline
      (pixl-playroom `scripts/entitlement-keys.mjs`).
    - The Worker holds its signing key (`ENTITLEMENT_SIGNING_KEY`, kid in
      `ENTITLEMENT_KID`, like `ent-2026-10`). It also holds a key set that
      the root signed (`ENTITLEMENT_KEYSET`): a JWS with header `{ alg:
      "EdDSA", kid: "root-1", typ: "pixl-keyset" }` and payload `{ iss,
      keys: { <kid>: <base64url raw key> }, iat }`.
    - Every 200 from `/api/entitlements` and `/api/trials` is
      `{ token, keyset }`.
    - The app keeps the newest key set it has seen (by `iat`) and replaces
      it whole. To rotate: sign a key set with the old and new keys, switch
      the Worker's signing key, then drop the old key from a later set. To
      revoke a key: publish a set without it.
- **Errors**, JSON `{ error, … }`:

  | Status | `error` | Meaning |
  |---|---|---|
  | 401 | `auth` | refresh, else sign in again |
  | 403 | `wrong_client` | the app's client isn't this product's |
  | 403 | `device_limit` | carries `devices: [{ id, name, lastSeen }]` |
  | 409 | `trial_used_account` | the account has had its trial |
  | 409 | `trial_used_device` | this device has had a trial |
  | 403 | `no_beta` | a beta build (`appVersion` has `-beta`), an account without beta |
  | 410 | `beta_ended` | a beta build after 1.0 |
  | 400 | `bad_request` | with `field` |
  | 429 | `too_many` | with `Retry-After` |

- **`policy.json`** (`updates.pixlfoundation.com/playroom/policy.json`,
  `{ minVersion, betaOpen, message? }`) is written by Playroom's release
  tooling, not here.

## Open beta

- [ ] `playroom.pixlfoundation.com/beta/`: what the beta is, then sign up or
      sign in, then accept the beta terms. Accepting grants beta access on
      the account; after that the page shows the download buttons and "Open
      Playroom and sign in". Windows users of 0.1.1-beta are told to
      reinstall once.
- [ ] Beta terms, `src/legal/beta.md`: pre-release with no warranty, how
      feedback may be used, that it ends at 1.0, and what data is collected.
- [ ] Admin: close sign-ups or cap them (the `programs` row), list testers,
      and export the emails of those who agreed to email.
- [ ] Ending the beta (at 1.0):
  - set the program's `ended_at`, which ends every beta entitlement, and
    flip `betaOpen` in `policy.json`
  - make a one-use Lemon Squeezy discount code for each tester account
    (Lemon Squeezy API) that expires 90 days after 1.0, show it on the
    account page and email it
  - testers then get the normal 14-day trial (they have used none)

## Billing (Lemon Squeezy)

- [ ] Checkout from the account page and the buy buttons: Lemon Squeezy's
      hosted checkout with `checkout_data.custom.user_id` and the account's
      email filled in. A buyer who isn't signed in is asked to sign in first,
      so every order lands on an account.
- [ ] The webhook stores each event once (`webhook_events`) and acts on it:
  - `order_created` grants the licence
  - `order_refunded` revokes it
  - `subscription_*` events manage add-ons (cloud tiers, playroom Pass 71),
    ending at the period's end
  - a failed payment gets a grace period, then the add-on ends
- [ ] Chargebacks:
  - find out what Lemon Squeezy tells us about disputes (it fights them as
    merchant of record)
  - a nightly Worker cron checks orders and subscriptions against Lemon
    Squeezy's API, which also catches missed webhooks
  - revoked access leaves the app at its next refresh, within the offline
    grace (30 days)
- [ ] `offers` on the Playroom page and the buy buttons, once checkout works
      (see Search).

## Updates (updates.pixlfoundation.com)

- [x] R2 bucket `pixl-updates` on updates.pixlfoundation.com (custom
      domain, TLS 1.2 minimum), created 2026-10-01. Cache lifetimes come from
      each object's `Cache-Control`, set at upload: `no-cache` for the
      `*.yml` feeds and `policy.json`, `immutable` for installers.
- [ ] Layout `/playroom/` (feeds, installers, blockmaps, `policy.json`),
      and later `/space/`. Playroom's release.yml uploads to it (pixl-playroom
      Pass 23).
- [ ] Stable download links: `playroom…/download/mac-arm64`, `mac-x64` and
      `win-x64` redirect, through the Worker, to the installer named in the
      current feed. During the beta, the beta page shows them only after
      sign-in. That's for appearance only, since the app is locked without
      beta access anyway.
- [ ] Download counts per version and platform (Workers Analytics Engine),
      if wanted.

## Space Pixl

- [ ] **Migrate Space Pixl onto the company site.** space.pixlfoundation.com is
      the product page now; everything else Space Pixl has in public still lives
      on its own:
  - [x] Its update feed and installers moved from the R2 bucket to the
        repository's GitHub Releases (space-pixl `electron-builder.yml`,
        `dev-app-update.yml`), like Playroom's.
  - [ ] Download buttons on space.pixlfoundation.com pointing at those
        installers once a release is public.
  - [x] Restyle the Space Pixl app to Playroom's standards and replace the
        screenshot placeholders on space.pixlfoundation.com with real
        screenshots (`public/space/shots/`, from space-pixl's `scripts/shots.mjs`).
  - [ ] Its price and licensing, once decided (free for now; the EULA,
        `src/legal/space-eula.md`, is a draft that says so).

## Content to check before launch

- [ ] Competitor prices in the Playroom three-year cost table
      (`src/data/playroom.ts`, `COST_3Y`), gathered September 2026.
- [ ] `hello@pixlfoundation.com` is used for every contact and "notify me"
      link. Cloudflare Email Routing is on (2026-10-01: MX, SPF and DKIM
      records added), and `hello@` and `support@` forward to the owner's
      Gmail once its destination is verified and the two rules are added.
      Replies go out as support@ through Gmail's "Send mail as", using
      Resend's SMTP.
- [ ] Engine figures (`src/data/engine.ts`) against pixl-engine's README when
      the engine changes.

## Legal

- [x] Licence agreement, privacy policy and third-party notices at
      `pixlfoundation.com/legal/{eula,privacy,third-party}/` (`src/legal/*.md`,
      `src/layouts/Legal.astro`). The notices file comes from pixl-playroom:
      `node scripts/third-party-notices.mjs --web ../pixl-web`. Space Pixl
      has its own at `space.pixlfoundation.com/legal/…` (`src/legal/space-*.md`,
      the same text the app ships in its `legal/`).
- [ ] The licence agreement and privacy policy are drafts: fill in the
      [bracketed] parts and have a lawyer review them, then pass
      `draft={false}` from those pages (`src/pages/home/legal/`, and
      `src/pages/space/legal/` for Space Pixl's).
- [x] Space Pixl's third-party notices: `public/shared/legal/space-third-party-notices.txt`,
      from space-pixl's `node scripts/third-party-notices.mjs --web ../pixl-web`.

## Crash reports

- [x] `/api/crash` and `/api/report` (`worker/api.ts`) keep each report in
      the `pixl-reports` R2 bucket (crash/, minidump/, report/ by day), rate
      limited per client (`REPORT_LIMIT`, 20 a minute). Problem reports are
      what users send from Playroom's Settings → Report a problem.
- [ ] Create the bucket and its retention rules before the next deploy:
      `scripts/reports-bucket.sh` (90 days for crashes, a year for problem
      reports; the privacy policy says the same, in brackets until confirmed).
- [ ] Reading reports: list with `wrangler r2 object get`/the dashboard;
      minidumps are kept as Crashpad sent them (multipart, gzipped). Symbols
      from Playroom's release build are under `symbols/` in Breakpad's layout
      (`minidump-stackwalk --symbols-path`); Electron's own come from
      https://symbols.electronjs.org.

## Site

- [ ] `CLOUDFLARE_API_TOKEN` repository secret, so pushes to `main` deploy
      (`.github/workflows/deploy.yml`).
- [ ] An email sign-up to replace the `mailto:` "notify me" links.
- [x] Brand files from the PIXL Family Kit: favicons, touch and PWA icons,
      manifests, link cards and press kits (`node scripts/brand-assets.mts`,
      from `src/lib/marks.ts`). Rerun after any change to the marks.

## Search

- [x] Per-host `robots.txt` and `sitemap.xml`, canonical links (Playroom's
      legal copies point at the company site's), JSON-LD (Organization,
      WebSite, SoftwareApplication, FAQPage, BreadcrumbList), `noindex` on
      404s and on workers.dev/localhost, cache lifetimes in the Worker.
- [ ] Verify all four hosts in Google Search Console and Bing Webmaster Tools
      (DNS TXT records in Cloudflare, or one Domain property for
      pixlfoundation.com in Search Console), then submit each
      `https://<host>/sitemap.xml`.
- [ ] Once Playroom is on sale, add `offers` (price US$69.99, availability
      InStock) to its SoftwareApplication in `src/pages/playroom/index.astro`;
      until then the page makes no offer claim.
- [ ] Run Lighthouse (SEO and performance) on each live host after deploy;
      local previews are `noindex` by design, so check the real domains.
- [ ] Turn off `workers_dev` in `wrangler.jsonc` once nothing needs the
      workers.dev preview.
