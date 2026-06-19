/**
 * Firebase client SDK (browser). Returns null when Firebase is not configured so
 * the app can degrade gracefully (e.g. the unauthenticated landing/preview tier)
 * instead of crashing. Never imported into server-admin code paths.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { firebaseClientConfig, isFirebaseClientConfigured } from '@/lib/env'

let cachedApp: FirebaseApp | null = null
let cachedDb: Firestore | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseClientConfigured()) return null
  if (cachedApp) return cachedApp
  cachedApp = getApps().length ? getApp() : initializeApp(firebaseClientConfig)
  return cachedApp
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp()
  return app ? getAuth(app) : null
}

export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp()
  if (!app) return null
  if (cachedDb) return cachedDb
  // `ignoreUndefinedProperties` so optional profile/plan fields (schoolCode,
  // freeTextGoal, etc.) left blank don't make setDoc throw on `undefined`.
  try {
    cachedDb = initializeFirestore(app, { ignoreUndefinedProperties: true })
  } catch {
    cachedDb = getFirestore(app)
  }
  return cachedDb
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp()
  return app ? getStorage(app) : null
}

export function getCurrentUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null
}

export { isFirebaseClientConfigured }
