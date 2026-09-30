# TODO: pixl-web

Grouped by area; roughly in priority order within each.

## Space Pixl

- [ ] **Migrate Space Pixl onto the company site.** space.pixlfoundation.com is
      the product page now; everything else Space Pixl has in public still lives
      on its own:
  - [ ] Its update feed and installers are served from the `shipment` R2
        bucket's `r2.dev` URL, which is rate-limited and meant for development
        (space-pixl `README.md`, `electron-builder.yml`, `dev-app-update.yml`).
        Attach a pixlfoundation.com subdomain to the bucket (e.g.
        `downloads.pixlfoundation.com`, as `media.` is attached to `pixl-media`)
        and swap it into both files before a wide release.
  - [ ] Download buttons on space.pixlfoundation.com pointing at those
        installers once a release is public.
  - [ ] Restyle the Space Pixl app to Playroom's standards, then replace the
        three screenshot placeholders on space.pixlfoundation.com (hero,
        01 Analyse, 03 Stats: `.shot-ph` in `src/pages/space/index.astro`) with
        real screenshots (Optimise, Stats). A shot script like pixl-playroom's
        `scripts/site-tools.mjs` would keep them current.
  - [ ] Its price and licensing, once decided.

## Content to check before launch

- [ ] Competitor prices in the Playroom three-year cost table
      (`src/data/playroom.ts`, `COST_3Y`), gathered September 2026.
- [ ] `hello@pixlfoundation.com` is used for every contact and "notify me"
      link. Make sure it exists (Cloudflare Email Routing can forward it).
- [ ] Engine figures (`src/data/engine.ts`) against pixl-engine's README when
      the engine changes.

## Legal

- [x] Licence agreement, privacy policy and third-party notices at
      `pixlfoundation.com/legal/{eula,privacy,third-party}/` (`src/legal/*.md`,
      `src/layouts/Legal.astro`). The notices file comes from pixl-playroom:
      `node scripts/third-party-notices.mjs --web ../pixl-web`.
- [ ] The licence agreement and privacy policy are drafts: fill in the
      [bracketed] parts and have a lawyer review them, then pass
      `draft={false}` from those pages (`src/pages/home/legal/`).
- [ ] Space Pixl's third-party notices, with its first public release.

## Crash reports

- [ ] `/api/crash` (`worker/api.ts`) only logs a summary of each report. Keep
      them (an R2 bucket with a retention period, stated in the privacy
      policy) or hand them to Sentry, and add rate limiting before the app ships
      widely.

## Accounts and licensing

The app side is built (pixl-playroom: Settings → Licence, against Lemon
Squeezy's licence API, not enforced). The website side is stubbed:

- [x] `/api/webhooks/lemonsqueezy` checks the `X-Signature` HMAC and logs the
      event (`worker/api.ts`). Set the secret with
      `wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET` and point the store's
      webhook at `https://pixlfoundation.com/api/webhooks/lemonsqueezy`.
- [x] `/account/` explains licences until accounts exist; the app's "Manage
      devices" link goes there.
- [x] Draft D1 schema: `migrations/0001_accounts.sql` (users, licences,
      devices, webhook events). Not applied, and no database bound.
- [ ] Sign-in (email magic link, or Clerk/Supabase Auth), then:
  - [ ] the webhook storing orders and licence keys against accounts
        (idempotently: Lemon Squeezy retries);
  - [ ] `/api/account`, `/api/licences`, `/api/devices` (list, deactivate
        one, via Lemon Squeezy's API with the store key as a Worker secret);
  - [ ] `/api/checkout` and the buy buttons on playroom.pixlfoundation.com
        (Lemon Squeezy checkout overlay or hosted page).
- [ ] The account page: licences, devices, "deactivate", receipts.

## Site

- [ ] `CLOUDFLARE_API_TOKEN` repository secret, so pushes to `main` deploy
      (`.github/workflows/deploy.yml`).
- [ ] An email sign-up to replace the `mailto:` "notify me" links.
- [ ] Open Graph images for the company, Space Pixl and engine sites (only
      Playroom has one).
- [ ] Turn off `workers_dev` in `wrangler.jsonc` once nothing needs the
      workers.dev preview.
