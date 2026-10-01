import { defineConfig } from 'astro/config'

// Static output only: the Worker (worker/index.ts) picks the site folder by hostname
// and serves these files as assets. Each site lives under its own prefix in dist/.
export default defineConfig({
  output: 'static',
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  // `astro dev` has no Worker: pages' /api/* calls go to `pnpm preview`'s (wrangler dev on 8787).
  vite: { server: { proxy: { '/api': 'http://localhost:8787' } } },
})
