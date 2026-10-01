# pixl-web

The PIXL Foundation websites: four static Astro sites served by one Cloudflare Worker.

| Host | Site | Source |
|---|---|---|
| pixlfoundation.com | PIXL Foundation | `src/pages/home/` |
| playroom.pixlfoundation.com | Pixl Playroom | `src/pages/playroom/` |
| space.pixlfoundation.com | Space Pixl | `src/pages/space/` |
| engine.pixlfoundation.com | PIXL Engine | `src/pages/engine/` |

`www.pixlfoundation.com` redirects to the apex.

## How it fits together

```
src/lib/sites.ts        the four sites: subdomain → folder. Shared by the Worker and the pages
src/lib/links.ts        href(site, path, from): links between sites, right in dev and in a build
src/layouts/Base.astro  head, SEO tags, backdrop, nav and footer for every page
src/lib/marks.ts        the PIXL Family Kit's marks and pixel wordmark, as SVG (pages and scripts share it)
src/lib/seo.ts          sitemaps, robots.txt and the JSON-LD each page carries
src/components/         Nav, Footer, Wordmark, Stub; brand/ (Mark, Bitmap); engine/Architecture
src/styles/             brand.css (the PIXL brand kit) and base.css (tokens, reset, nav, footer)
public/shared/          fonts, press kits, legal notices and engine figures, served on every host at /shared/
public/<site>/          files for one site only, e.g. public/playroom/favicon.svg → playroom…/favicon.svg
media/                  video, served from the pixl-media R2 bucket at media.pixlfoundation.com
                        (scripts/push-media.sh uploads it; static assets can't serve Range requests)
worker/index.ts         picks the site folder from the Host header; /api/* goes to worker/api.ts
worker/account.ts       the PIXL account's API for the apps (entitlements, trials, devices)
supabase/               the PIXL account's database: migrations, tests, admin notes
wrangler.jsonc          the Worker, its static assets and its custom domains
```

Astro builds every site into `dist/<site>/`. The Worker runs before any asset and
rewrites `playroom.pixlfoundation.com/x` to `dist/playroom/x`. Build output
(`/_astro/`), `/shared/` and `/robots.txt` are served as-is on every host.

## Running

```sh
pnpm install
pnpm dev        # astro dev: every site under its folder, e.g. localhost:4321/playroom/
pnpm preview    # a real build through the Worker: localhost:8787, playroom.localhost:8787, …
pnpm check      # astro check + the Worker's types
pnpm run deploy # build and wrangler deploy (needs `wrangler login`; plain `pnpm deploy` is a pnpm built-in)
node scripts/brand-assets.mts   # favicons, touch icons, manifests, link cards, press kits (Chrome, ImageMagick, zip)
```

`pnpm preview` builds with `PUBLIC_ROOT_DOMAIN=localhost:8787`, so links between
sites stay local, and runs `wrangler dev --env local`, which has no routes and so
keeps each request's own host.

The PIXL account (sign-in, `/account/`, `/oauth/consent/`, `/api/entitlements`…)
runs on Supabase project pixl-core; its schema and admin notes are in
`supabase/README.md`. For the account API under `pnpm preview`, run
`node scripts/entitlement-key.mts dev-2026-10 --dev-vars` once (it writes
`.dev.vars`), then `node scripts/account-smoke.mts` checks it end to end. The
consent page only works on https://pixlfoundation.com (Supabase checks the origin).

Pushes to `main` deploy through `.github/workflows/deploy.yml` (needs a
`CLOUDFLARE_API_TOKEN` repository secret).
