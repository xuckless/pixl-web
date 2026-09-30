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
  - [ ] Real screenshots of the app (Optimise, the preview, Stats). The page
        uses the engine's size chart until then; a shot script like
        pixl-playroom's `scripts/site-tools.mjs` would keep them current.
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

## Accounts and licensing (not built)

- [ ] Accounts, checkout and licence keys through Lemon Squeezy: buy, get a
      key, up to 3 devices at a time, remove one to add one.
- [ ] Device management on the website.
- [ ] Everything under `/api/*` but `/api/crash` is a 501 stub until then (`worker/api.ts`).

## Site

- [ ] `CLOUDFLARE_API_TOKEN` repository secret, so pushes to `main` deploy
      (`.github/workflows/deploy.yml`).
- [ ] An email sign-up to replace the `mailto:` "notify me" links.
- [ ] Open Graph images for the company, Space Pixl and engine sites (only
      Playroom has one).
- [ ] Turn off `workers_dev` in `wrangler.jsonc` once nothing needs the
      workers.dev preview.
