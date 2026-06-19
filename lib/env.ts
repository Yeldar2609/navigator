/**
 * Centralized, typed environment access for Kim Bolam.
 *
 * Production fails CLOSED: if `APP_ENV=production` and a critical variable is
 * missing, `assertProductionEnv()` throws rather than silently degrading (which
 * could grant fake auth or expose an unconfigured backend). Call it from server
 * entry points (e.g. the Firebase admin init / API routes).
 *
 * NEXT_PUBLIC_* vars are inlined at build time and readable on client + server.
 */

export type AppEnvName = 'development' | 'production' | 'test'

export function appEnv(): AppEnvName {
  const v = process.env.APP_ENV ?? process.env.NODE_ENV
  if (v === 'production') return 'production'
  if (v === 'test') return 'test'
  return 'development'
}

export function isProd(): boolean {
  return appEnv() === 'production'
}

export const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Kim Bolam'
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/** Public Firebase web config (client-safe). */
export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

export function isFirebaseClientConfigured(): boolean {
  return Boolean(
    firebaseClientConfig.apiKey &&
      firebaseClientConfig.projectId &&
      firebaseClientConfig.appId,
  )
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      firebaseClientConfig.projectId,
  )
}

/**
 * The AI counselor is "configured" only when explicitly enabled AND a real
 * Dialogflow CX agent id is present. Otherwise it must present a disabled state
 * — we never fake AI as real in production.
 */
export function isAiCounselorConfigured(): boolean {
  return Boolean(
    process.env.ENABLE_AI_COUNSELOR === 'true' &&
      process.env.DIALOGFLOW_CX_PROJECT_ID &&
      process.env.DIALOGFLOW_CX_LOCATION &&
      process.env.DIALOGFLOW_CX_AGENT_ID,
  )
}

/** Offline AI mock — DEV only; never honored in production. */
export function isAiMockEnabled(): boolean {
  return process.env.ENABLE_AI_MOCK === 'true' && !isProd()
}

export const reportBucket =
  process.env.REPORT_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET ||
  firebaseClientConfig.storageBucket

/** Variables that MUST exist in a production deployment. */
const PRODUCTION_REQUIRED = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
] as const

/** Throws in production if any critical variable is missing. No-op otherwise. */
export function assertProductionEnv(): void {
  if (!isProd()) return
  const missing = PRODUCTION_REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[Kim Bolam] Production is misconfigured — missing required env: ${missing.join(', ')}. ` +
        'Refusing to start with a partial configuration (fail-closed).',
    )
  }
}
