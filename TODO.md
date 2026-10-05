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
- [x] Deployed 2026-10-01 (Worker version `72acf74c`). Checked on
      production: the app's authorize URL → consent → "Continue" → the
      loopback with a code that exchanges, and the cookie shared with
      playroom.pixlfoundation.com. Handoffs (b) and (c) were sent to the
      Playroom session.
- [x] Signed in from a real Playroom build against production (2026-10-01,
      Pass 25): the owner joined through `/beta/`, and the app's token and
      key set verify offline against root-1 alone.
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
    an app, the email change with both codes, and deleting through the
    page.
  - The delete endpoint refuses an app's token and a missing token.
  - Supabase sends one email per address a minute, so asking for a delete
    code right after another code says "wait N seconds".
  - Receipts through Lemon Squeezy's customer portal come with billing.
- [x] Supabase's email rate limit is raised from its default, 2 an hour
      for the whole project, to 500 an hour (2026-10-01).
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
- [x] Production secrets set 2026-10-01:
  - `SUPABASE_SECRET_KEY`.
  - `DEVICE_PEPPER`; a copy is in `~/.pixl-secrets/device-pepper` on the
    owner's Mac. Never change it, or every device counts as new.
  - `ENTITLEMENT_SIGNING_KEY`, kid `ent-2026-10`, public key
    `Q_fcib8lV0ofvxA4bOCsVbNX9xUvLgB1MU-1End6GYA`.
  - `ENTITLEMENT_KEYSET`, signed by root-1 (iat 1790856772).
  - `node scripts/account-smoke.mts https://pixlfoundation.com` passes.
  - To rotate the signing key:
    - `node scripts/entitlement-key.mts ent-YYYY-MM --put`;
    - sign a key set listing both the old and the new key;
    - set `ENTITLEMENT_KID` and deploy;
    - later, sign a key set without the old key.
- [ ] Trial abuse:
  - a verified email and Turnstile to sign up
  - disposable-email domains refused (done: the sign-up hook)
  - sign-ups rate-limited per IP (a Workers rate limit binding, plus
    Supabase's own auth limits)
  - one trial per account _and_ per device per product
  - flag a device hash that turns up on many accounts
- [x] Privacy policy: the account, the hashed device id and the entitlement
      checks are drafted ("Your PIXL account"). The lawyer's review is
      under Legal.
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

- [x] `playroom.pixlfoundation.com/beta/`, live since 2026-10-01 (Worker
      `3a8a8e32`; checked on production by joining with a throwaway
      account):
  - The page says what the beta is, then offers sign-in (the embedded
    form) and the beta terms with a product-news checkbox, then Join.
  - Once joined it shows the downloads (the newest beta build, from the
    feeds), how to sign in in the app, and the note that Windows 0.1.1-beta
    users must reinstall.
  - There are closed, full and ended states.
  - Joining is `POST /api/beta/join` → `join_beta()`, which records the
    agreement and grants beta access on 3 devices
    (`supabase/tests/beta.sql`).
  - `beta_status()` tells anyone whether the beta is open, full or over.
  - The Playroom page links to it from the nav ("Beta", and the "Join the
    beta" button), the hero, a beta section (`#beta`, before pricing), the
    pricing card and the closing call. The app's "Join the beta" opens it
    too.
- [x] Download links: `playroom…/download/{mac-arm64,mac-x64,win-x64}` and
      `?channel=beta` redirect to the installer the current feed names, and
      `/api/downloads/playroom` lists them (`worker/downloads.ts`). Until
      there's a feed, they go back to the page.
- [x] Beta terms, `src/legal/beta.md` (draft, version `2026-10`, at
      `/legal/beta/` on both sites). The privacy policy's new "Your PIXL
      account" section covers the account, devices and checks. Both still
      need the lawyer, and the discount amount is still in brackets.
  - When the terms change, change `version:` in `beta.md` and
    `programs.terms_version` together: joining refuses a mismatch. Beta
    access then **pauses** for every tester until they accept again on the
    beta page; the app gets `no_beta`, and the account page says "Paused".
  - Joining takes two boxes: 18+ with the terms, and a separate one for
    section 9 (no warranty, no liability). Both are recorded as agreements,
    `playroom-beta-terms` and `playroom-beta-liability`.
  - Owner decisions (2026-10-01): 18+, Ontario law (in the EULAs too), and
    30% off for testers.
  - The app ships a plain-text copy of `beta.md`
    (pixl-playroom `scripts/legal-copy.mjs`): tell the app side whenever
    the text changes.
- [x] Who we are: "PIXL Foundation" is the trading name of Syed Ali,
      a for-profit business, not yet registered.
  - A notice on every page's footer, `/legal/` ("Who we are", with the
    trademark note), and a line in the company site's About section.
  - The EULAs and privacy policies name him; the privacy policy names him
    as controller.
  - When the company is registered: update `src/legal/about.md`, the
    footer and every document's opening.
- [x] `support@` and `hello@` forward to the owner's Gmail (Cloudflare
      Email Routing rules, added 2026-10-01).
- [x] Admin: close sign-ups or cap them, list testers, and export the
      emails of those who agreed to email, all in SQL
      (`supabase/README.md`).
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
- [x] Stable download links: `playroom…/download/mac-arm64`, `mac-x64` and
      `win-x64` (see "Open beta"). Layout: `playroom/<version>/<file>`, with
      the feeds pointing into it. The names carry no version
      (`pixl-playroom-mac-arm64.dmg`, `pixl-playroom-win-x64-setup.exe`…).
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

- [x] `llms.txt` / `llms-full.txt` for the company site, Playroom and the
      engine (2026-10-01; see README). Keep them in step with every
      release.
- [x] Marketing claims the code no longer backs, fixed 2026-10-01:
  - Playroom: the tools showcase (11 tools, Enhance added, "Engine report",
    Lens Corrections and Heal named), project files instead of "a small
    recipe", models downloaded rather than bundled, no HEIC export yet, no
    sky mask, AI Select Subject.
  - Legal: the privacy policy's update checks, and the EULA's account-based
    licence and trial (what an ended trial locks).
  - Engine site: 13 calls, the operations and "beyond the grade" lists,
    float TIFF, macOS and Windows only, Node and Swift bindings (no Kotlin
    or command line).
- [ ] Re-shoot the Playroom screenshots that show old UI: the Enhance shot
      still reads "the bundled Real-ESRGAN ×2 model". Add Lens Corrections
      and Heal to the tools showcase (pixl-playroom
      `scripts/site-media.sh tools shots`, with `scripts/site-tools.mjs`
      taught the two new tools).

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
- [x] The `pixl-reports` bucket and its retention rules exist
      (`scripts/reports-bucket.sh`, run 2026-10-01): 90 days for crashes, a
      year for problem reports. The privacy policy says the same, in
      brackets until confirmed.
- [ ] Reading reports: list with `wrangler r2 object get`/the dashboard;
      minidumps are kept as Crashpad sent them (multipart, gzipped). Symbols
      from Playroom's release build are under `symbols/` in Breakpad's layout
      (`minidump-stackwalk --symbols-path`); Electron's own come from
      https://symbols.electronjs.org.

## Reports become GitHub issues

**Deferred (owner, 2026-10-01): not now.** The plan below is kept for later;
don't start on it until it's picked up again.

Requested 2026-10-01: every crash and problem report that lands in R2 should
turn into a GitHub issue we can fix from, without anyone reading the bucket.
The app side is pixl-playroom's Pass 24a.

**Decide first:** pixl-playroom, pixl-web and space-pixl are **public**
repositories, and reports must never appear there. They carry the user's own
words, log tails with file names, and minidumps with fragments of memory. So
the issues go to a **private triage repository** (say `xuckless/pixl-triage`).
A fix in a public repository then references the private issue by number,
without quoting it. The privacy policy must also name GitHub as somewhere
reports are kept.

- [ ] **The watcher**:
  - R2 event notifications on `pixl-reports` (object created, under
    `crash/`, `minidump/` and `report/`) feed a Cloudflare Queue,
    `pixl-report-events`.
  - A `queue()` consumer in this Worker reads each new object and files or
    updates an issue. The queue gives retries and batching for free.
  - A nightly cron (`scheduled()`) sweeps the last day's keys, catching
    anything an event missed.
- [ ] **Grouping**, so one bug is one issue, not a thousand:
  - Each JSON crash gets a fingerprint: a hash of the app, the kind, the
    message with numbers, paths and ids taken out, and the top few frames
    of our own code in the stack.
  - A D1 table `report_issues` maps each fingerprint to its issue number,
    with a count, first and last seen, the versions and platforms hit, and
    the state.
  - A new fingerprint opens an issue: title from the message, labels
    `crash`, `auto`, the app, the platform and the version. The body holds
    the scrubbed stack, the versions, and the R2 keys of a few examples.
  - A known fingerprint only updates the table, plus a comment when
    something new shows up: a new version, a new platform, or every 10x in
    the count.
  - A **regression** reopens the issue with a `regression` label: the
    issue was closed as fixed in version N, and a report comes in from N
    or later.
- [ ] **Minidumps** need `minidump-stackwalk` and the symbols, which a
      Worker can't run. The consumer sends a `repository_dispatch` to the
      triage repository. A workflow there (pixl-playroom Pass 24a) fetches
      the dump from R2 and symbolicates it with `symbols/` and Electron's
      symbol server. It takes the fingerprint from the crashing thread's
      top frames and files or updates the issue the same way, through this
      Worker's `/api/triage/issue`, so all the grouping stays in one place.
- [ ] **Problem reports** are what a person wrote, so each one gets its own
      issue (labels `user-report`, the app, the version, the platform). It
      holds:
  - the message, the reference the user was given, and the log tail,
    already scrubbed by the app, inside a collapsed block;
  - **not** the email address, which stays in R2 only. The issue says
    "reply address on file". Answering is a script that reads it from R2:
    `scripts/report.mts <reference>`.
- [ ] **Flood control**:
  - At most 20 new issues a day; past that, a single daily digest issue.
  - Per-client rate limits as now.
  - A fingerprint that's muted (label `wontfix` or `noise`) is only
    counted.
- [ ] **GitHub access**: a GitHub App installed on the triage repository
      only, with Issues read and write. Secrets `GITHUB_APP_ID` and
      `GITHUB_APP_PRIVATE_KEY`; the Worker mints installation tokens. Better
      than a personal token: scoped to one repository, and not tied to a
      person.
- [ ] **Fixing from the issue**: each issue carries what's needed to start,
      such as the app version, the commit it was built from (sent with the
      report from Pass 24a), the symbolicated stack and the file and line.
      A `fix-me` label can hand it to a coding agent (for example Claude
      Code's GitHub Action, with access to the app's repository).
- [ ] Space Pixl's reports, when it sends them: same pipeline, labelled
      `space`.

## Site

- [ ] `CLOUDFLARE_API_TOKEN` repository secret, so pushes to `main` deploy
      (`.github/workflows/deploy.yml`).
- [ ] An email sign-up to replace the `mailto:` "notify me" links.
- [x] Brand files from the PIXL Family Kit: favicons, touch and PWA icons,
      manifests, link cards and press kits (`node scripts/brand-assets.mts`,
      from `src/lib/marks.ts`). Rerun after any change to the marks.

## Playroom: attach a review (stashed idea, 2026-10-05)

A way for a tester to attach a review from inside the app, so real words can
back the site's claims. Nothing here is built.

- [ ] In the app (pixl-playroom's TODO): an optional "Leave a review" in the
      Help menu or the What's new popup, never a nag. Free text, a star
      rating, and a clear opt-in: whether the review may be shown on the
      site, with the tester's first name or none. Sent with the PIXL account,
      not the photos.
- [ ] A table and an endpoint for reviews in the Worker (`worker/api.ts`) and
      `supabase/migrations/`, with RLS so a user reads and deletes only
      their own, and an admin view to approve one for display.
- [ ] A "What testers say" section on the Playroom page that shows approved
      reviews only, with their real star count and number; until there are
      some, the page shows none (no invented proof). Rework the page's
      "Made by one developer, in the open" strip around it when it lands.
- [ ] Say in the privacy policy what a review stores and how to delete it.

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
