# TODO: pixl-web

Grouped by area; roughly in priority order within each.

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
      link. Make sure it exists (Cloudflare Email Routing can forward it).
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
