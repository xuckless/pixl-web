import { defineConfig } from 'astro/config'

// Static output only: the Worker (worker/index.ts) picks the site folder by hostname
// and serves these files as assets. Each site lives under its own prefix in dist/.
export default defineConfig({
  output: 'static',
  build: { format: 'directory' },
  trailingSlash: 'ignore',
})
