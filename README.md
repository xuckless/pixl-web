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
src/components/         Nav, Footer, Wordmark, Mark, Stub
src/styles/             brand.css (the PIXL brand kit) and base.css (tokens, reset, nav, footer)
public/shared/          fonts and brand marks, served on every host at /shared/
public/<site>/          files for one site only, e.g. public/playroom/favicon.svg → playroom…/favicon.svg
media/                  video, served from the pixl-media R2 bucket at media.pixlfoundation.com
                        (scripts/push-media.sh uploads it; static assets can't serve Range requests)
worker/index.ts         picks the site folder from the Host header; /api/* is stubbed (501)
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
pnpm deploy     # build and wrangler deploy (needs `wrangler login`)
```

`pnpm preview` builds with `PUBLIC_ROOT_DOMAIN=localhost:8787`, so links between
sites stay local, and runs `wrangler dev --env local`, which has no routes and so
keeps each request's own host.

Pushes to `main` deploy through `.github/workflows/deploy.yml` (needs a
`CLOUDFLARE_API_TOKEN` repository secret).
