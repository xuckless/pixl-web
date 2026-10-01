// Sign in with Apple's client secret for the PIXL account (Supabase project
// pixl-core). Apple wants an ES256 JWT signed with the Sign in with Apple key,
// lasting at most six months, so this has to be rerun before it expires.
//   node scripts/apple-client-secret.mts            prints the JWT and its expiry
//   node scripts/apple-client-secret.mts --apply    also sets it on pixl-core
//                                                   (needs `supabase login`)
// The key stays in ~/.apple-signing/ (downloaded once from Apple's developer
// site); nothing secret is kept in the repository.
import { execFileSync } from 'node:child_process'
import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const TEAM_ID = '2MGLZ5685D'
const KEY_ID = '37K7A3NV3J'
const SERVICES_ID = 'com.pixlfoundation.signin.web'
const PROJECT_REF = 'lskosagqyekwklxyuczi'
const KEY_FILE = `${homedir()}/.apple-signing/SignInWithApple_AuthKey_${KEY_ID}.p8`
// Apple refuses more than 15,777,000 seconds (about six months).
const LIFETIME_S = 180 * 24 * 60 * 60

const b64 = (o: object): string => Buffer.from(JSON.stringify(o)).toString('base64url')
const now = Math.floor(Date.now() / 1000)
const exp = now + LIFETIME_S
const unsigned = `${b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })}.${b64({
  iss: TEAM_ID,
  iat: now,
  exp,
  aud: 'https://appleid.apple.com',
  sub: SERVICES_ID
})}`
const key = createPrivateKey(readFileSync(KEY_FILE))
const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' })
const jwt = `${unsigned}.${signature.toString('base64url')}`
const expires = new Date(exp * 1000).toISOString()

if (!process.argv.includes('--apply')) {
  console.log(jwt)
  console.error(`expires ${expires}`)
} else {
  // The CLI keeps its access token in the keychain ("Supabase CLI").
  let token = execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w'])
    .toString()
    .trim()
  if (token.startsWith('go-keyring-base64:'))
    token = Buffer.from(token.slice('go-keyring-base64:'.length), 'base64').toString()
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ external_apple_secret: jwt })
  })
  if (!res.ok) throw new Error(`Supabase: HTTP ${res.status}: ${await res.text()}`)
  console.log(`Apple client secret set on pixl-core; expires ${expires}`)
}
