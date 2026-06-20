/**
 * Firebase Admin SDK (server only — NEVER import from client components).
 *
 * Provides ID-token verification and admin Firestore/Storage handles. Returns
 * null when admin credentials are absent so route handlers can fail soft in dev;
 * production fails closed via `assertProductionEnv()` at the call site.
 */
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import {
  firebaseClientConfig,
  isFirebaseAdminConfigured,
  reportBucket,
} from '@/lib/env'

let cachedApp: App | null = null

export function getAdminApp(): App | null {
  if (!isFirebaseAdminConfigured()) return null
  if (cachedApp) return cachedApp

  const existing = getApps()
  if (existing.length > 0) {
    cachedApp = existing[0]
    return cachedApp
  }

  // Prefer an explicit service-account key when provided; otherwise fall back to
  // Application Default Credentials (ADC) — the runtime service account on App
  // Hosting / Cloud Run, or `gcloud auth application-default login` locally. ADC
  // is required where org policy disables downloadable service-account keys.
  const hasExplicitKey = Boolean(
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  )
  cachedApp = initializeApp({
    credential: hasExplicitKey
      ? cert({
          projectId: firebaseClientConfig.projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL as string,
          // Secret Manager / .env store the key with literal \n — restore newlines.
          privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
        })
      : applicationDefault(),
    projectId: firebaseClientConfig.projectId || process.env.GOOGLE_CLOUD_PROJECT,
    storageBucket: reportBucket,
  })
  return cachedApp
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp()
  return app ? getFirestore(app) : null
}

export function getAdminBucket() {
  const app = getAdminApp()
  return app ? getStorage(app).bucket() : null
}

/** Verify a Firebase ID token. Returns the decoded token, or null if invalid/unconfigured. */
export async function verifyIdToken(idToken: string | undefined | null): Promise<DecodedIdToken | null> {
  if (!idToken) return null
  const app = getAdminApp()
  if (!app) return null
  try {
    return await getAuth(app).verifyIdToken(idToken)
  } catch {
    return null
  }
}

/**
 * Extract and verify the bearer token from a request's Authorization header.
 * Returns the decoded token (with uid) or null. Never trust a client-supplied uid;
 * always derive identity from this.
 */
export async function getAuthedUser(req: Request): Promise<DecodedIdToken | null> {
  const header = req.headers.get('authorization') || req.headers.get('Authorization')
  const token = header?.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : undefined
  return verifyIdToken(token)
}
