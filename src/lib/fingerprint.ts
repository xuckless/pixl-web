// Build time only (pages and components, never the Worker): it reads public/.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { SITES, type SiteId } from './sites'

const hashes = new Map<string, string>()

/**
 * `path` (a file under public/<site>/) with ?v=<its content hash>. Images are
 * cached for a day under names that stay the same when a file changes, so a
 * new screenshot needs a new URL to be seen at once.
 */
export function fingerprint(site: SiteId, path: string): string {
  const file = join(process.cwd(), 'public', SITES[site].dir, path)
  let v = hashes.get(file)
  if (v === undefined) {
    v = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 10)
    hashes.set(file, v)
  }
  return `${path}?v=${v}`
}
