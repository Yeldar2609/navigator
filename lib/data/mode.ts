import { isFirebaseClientConfigured } from '@/lib/env'

/**
 * Demo mode = DEV-only local auth + localStorage persistence + client scoring.
 *
 * Resolution order (explicit DEMO_MODE wins FIRST, so an explicit demo build is
 * never overridden by a present Firebase config in .env.local):
 *   1. NEXT_PUBLIC_DEMO_MODE=on  → demo
 *   2. NEXT_PUBLIC_DEMO_MODE=off → not demo
 *   3. Firebase configured       → not demo (real auth + Firestore)
 *   4. otherwise                 → demo only outside production
 *
 * Note: NEXT_PUBLIC_* vars are inlined at build time. To ship a *production*
 * demo (e.g. the e2e server), build with NEXT_PUBLIC_DEMO_MODE=on.
 */
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'on') return true
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'off') return false
  if (isFirebaseClientConfigured()) return false
  return process.env.NODE_ENV !== 'production'
}

/** True when Firebase is configured AND we are not in demo mode. */
export function isFirebaseMode(): boolean {
  return isFirebaseClientConfigured() && !isDemoMode()
}
