// The entitlement token an app keeps and checks offline (TODO.md, "Contract
// with the apps"): a compact JWS, EdDSA (Ed25519), what the account holds for
// this product on this device. The app trusts the signing key through the key
// set the owner signed with the offline root key (ENTITLEMENT_KEYSET), which
// goes out beside every token.

import { importJWK, SignJWT, type CryptoKey, type JWK } from 'jose'

export interface EntitlementEnv {
  /** The signing key, a private Ed25519 JWK as JSON (scripts/entitlement-key.mts; a secret). */
  ENTITLEMENT_SIGNING_KEY?: string
  /** Its key id, as listed in the key set (wrangler.jsonc vars). */
  ENTITLEMENT_KID: string
  /** The root-signed key set (a JWS) listing the signing keys apps may trust (a secret). */
  ENTITLEMENT_KEYSET?: string
}

/** What the account holds, as account_holdings() in the database returns it. */
export interface Ent {
  beta?: { until?: number }
  trial?: { until: number }
  licence?: { since: number }
  addons: string[]
}

const DAY_S = 24 * 60 * 60
/** The offline grace: how long the app may go without checking in. */
const LIFETIME_S = 30 * DAY_S
/** When the app should check in again ("refresh after"). */
const REFRESH_S = DAY_S

let key: { jwk: string; key: CryptoKey | Uint8Array } | undefined

async function signingKey(env: EntitlementEnv): Promise<CryptoKey | Uint8Array> {
  if (!env.ENTITLEMENT_SIGNING_KEY) throw new Error('ENTITLEMENT_SIGNING_KEY is not set')
  if (key?.jwk !== env.ENTITLEMENT_SIGNING_KEY) {
    key = { jwk: env.ENTITLEMENT_SIGNING_KEY, key: await importJWK(JSON.parse(env.ENTITLEMENT_SIGNING_KEY) as JWK, 'EdDSA') }
  }
  return key.key
}

export async function entitlementToken(
  env: EntitlementEnv,
  t: { userId: string; email?: string; product: string; deviceHash: string; ent: Ent; discount?: { code: string; expires: number } | null }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    dev: t.deviceHash,
    rfa: now + REFRESH_S,
    ...(t.email ? { email: t.email } : {}),
    ent: t.ent,
    ...(t.discount ? { discount: t.discount } : {})
  })
    .setProtectedHeader({ alg: 'EdDSA', kid: env.ENTITLEMENT_KID, typ: 'JWT' })
    .setIssuer('pixlfoundation.com')
    .setSubject(t.userId)
    .setAudience(t.product)
    .setIssuedAt(now)
    .setExpirationTime(now + LIFETIME_S)
    .sign(await signingKey(env))
}
