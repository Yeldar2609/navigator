#!/usr/bin/env node
/**
 * set-admin.mjs — grant (or revoke) the Firebase `admin` custom claim.
 *
 * The admin dashboard authorizes EVERY request on the `admin: true` custom claim
 * baked into the user's Firebase ID token. This script is the ONLY way that claim
 * is set: it runs out-of-band by a trusted operator, never from the app.
 *
 * It uses the Firebase Admin SDK with Application Default Credentials (ADC), the
 * same credential path production uses (the org disables downloadable keys):
 *   - locally:   `gcloud auth application-default login`
 *   - or a service account via GOOGLE_APPLICATION_CREDENTIALS
 *
 * Usage:
 *   node scripts/set-admin.mjs <uid>            # grant  admin:true
 *   node scripts/set-admin.mjs <uid> --revoke   # remove admin claim
 *
 * The project id comes from GOOGLE_CLOUD_PROJECT / GCLOUD_PROJECT /
 * FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID (whichever is set), or
 * from the ADC credentials.
 *
 * IMPORTANT: the user must SIGN OUT and SIGN BACK IN (or force-refresh their ID
 * token) for the new claim to take effect — claims are only re-read on token
 * refresh.
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const args = process.argv.slice(2)
const revoke = args.includes('--revoke')
const uid = args.find((a) => !a.startsWith('--'))

if (!uid) {
  console.error('Usage: node scripts/set-admin.mjs <uid> [--revoke]')
  console.error('Find a uid in the Firebase console → Authentication → Users (UID column).')
  process.exit(1)
}

const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  undefined

async function main() {
  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault(), projectId })
  }
  const auth = getAuth()

  // Verify the user exists and surface a clear error if not.
  let user
  try {
    user = await auth.getUser(uid)
  } catch (err) {
    console.error(`Could not find a user with uid "${uid}".`)
    console.error('Check the uid in Firebase console → Authentication → Users.')
    console.error(String(err?.message || err))
    process.exit(1)
  }

  // Preserve any existing claims; only flip the `admin` key.
  const existing = user.customClaims || {}
  const next = { ...existing }
  if (revoke) {
    delete next.admin
  } else {
    next.admin = true
  }

  await auth.setCustomUserClaims(uid, next)

  console.log(
    revoke
      ? `Revoked admin claim for ${uid} (${user.email || 'no email'}).`
      : `Granted admin:true for ${uid} (${user.email || 'no email'}).`,
  )
  console.log('The user must sign out and sign back in to refresh their ID token.')
}

main().catch((err) => {
  console.error('Failed to set custom claim.')
  console.error(String(err?.stack || err))
  process.exit(1)
})
