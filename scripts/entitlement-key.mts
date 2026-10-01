// The Worker's key for signing entitlement tokens (worker/entitlements.ts):
// a new Ed25519 key pair. The apps trust it once it's in a key set the owner
// signs with the offline root key (pixl-playroom scripts/entitlement-keys.mjs).
//   node scripts/entitlement-key.mts <kid> --put
//       Production. Stores the private key with `wrangler secret put
//       ENTITLEMENT_SIGNING_KEY` (never printed) and prints <kid>=<public>
//       for `sign-keyset root-1 …`. Then put that key set in
//       ENTITLEMENT_KEYSET, and <kid> in wrangler.jsonc's ENTITLEMENT_KID.
//   node scripts/entitlement-key.mts <kid> --dev-vars
//       `pnpm preview`/`wrangler dev`: writes .dev.vars (gitignored) with this
//       key, a key set signed by the development root (../pixl-playroom),
//       pixl-core's secret key and a device pepper.
import { execFileSync } from 'node:child_process'
import { generateKeyPairSync, randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { apiKeys } from './lib/supabase.mts'

const [kid, mode] = process.argv.slice(2)
if (!kid || !/^[a-z0-9-]+$/.test(kid) || !['--put', '--dev-vars'].includes(mode ?? '')) {
  throw new Error('usage: entitlement-key.mts <kid> --put | --dev-vars   (e.g. ent-2026-10)')
}

const { privateKey, publicKey } = generateKeyPairSync('ed25519')
const jwk = JSON.stringify(privateKey.export({ format: 'jwk' }))
const pub = publicKey.export({ format: 'jwk' }).x!

if (mode === '--put') {
  execFileSync('pnpm', ['exec', 'wrangler', 'secret', 'put', 'ENTITLEMENT_SIGNING_KEY'], { input: jwk, stdio: ['pipe', 'inherit', 'inherit'] })
  console.log(`${kid}=${pub}`)
  console.error(`Now, in pixl-playroom: node scripts/entitlement-keys.mjs sign-keyset root-1 ${kid}=${pub}`)
  console.error('and put its output in ENTITLEMENT_KEYSET; set ENTITLEMENT_KID to', kid)
} else {
  const keyset = execFileSync('node', ['scripts/entitlement-keys.mjs', 'sign-keyset', 'dev-root', `${kid}=${pub}`], { cwd: '../pixl-playroom' })
    .toString()
    .trim()
  // Keep values already there (a pepper especially: changing it makes every device new).
  const vars = new Map<string, string>()
  if (existsSync('.dev.vars')) {
    for (const line of readFileSync('.dev.vars', 'utf8').split('\n')) {
      const m = /^([A-Z_]+)=(.*)$/.exec(line)
      if (m) vars.set(m[1], m[2])
    }
  }
  vars.set('ENTITLEMENT_SIGNING_KEY', `'${jwk}'`)
  vars.set('ENTITLEMENT_KID', kid)
  vars.set('ENTITLEMENT_KEYSET', keyset)
  if (!vars.has('DEVICE_PEPPER')) vars.set('DEVICE_PEPPER', randomBytes(32).toString('base64url'))
  if (!vars.has('SUPABASE_SECRET_KEY')) vars.set('SUPABASE_SECRET_KEY', (await apiKeys()).secret)
  writeFileSync('.dev.vars', [...vars].map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 })
  console.log(`.dev.vars: signing key ${kid} (${pub}), key set from the development root`)
}
