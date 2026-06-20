import { isDemoMode } from '@/lib/data/mode'
import { demoStore } from '@/lib/demo/store'
import {
  emailSignInOrUp,
  googleSignIn,
  sendPasswordReset,
  signOutFirebase,
} from '@/lib/firebase/auth-client'

export interface AuthResult {
  ok: boolean
  error?: string
}

/**
 * Sign in or sign up. In demo mode (preview tier) this creates a local DEV-only
 * session — clearly NOT production auth. With Firebase configured, real auth runs.
 */
export async function signInOrUp(
  mode: 'sign-in' | 'sign-up',
  email: string,
  password: string,
): Promise<AuthResult> {
  if (isDemoMode()) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Navigator] DEMO MODE auth is active (DEV only). Configure Firebase env to use real authentication.',
    )
    demoStore.signIn(email)
    return { ok: true }
  }

  return emailSignInOrUp(mode, email, password)
}

/** Sign in with Google. In demo mode this stubs a local preview session. */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (isDemoMode()) {
    demoStore.signIn('google@preview.local')
    return { ok: true }
  }
  return googleSignIn()
}

/**
 * Request a password-reset email. In demo mode this is a no-op that reports success
 * (preview has no real accounts). With Firebase configured, a reset link is sent.
 * Callers should show a neutral confirmation regardless, to avoid account enumeration.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (isDemoMode()) {
    return { ok: true }
  }
  return sendPasswordReset(email)
}

export function getDemoUser() {
  return demoStore.getUser()
}

export async function signOutClient(): Promise<void> {
  // Clear the local cache in ALL modes so a sign-out wipes the previous student's
  // profile/result/plan/checkins on a shared device — not just in demo mode.
  demoStore.signOut()
  if (isDemoMode()) {
    return
  }
  await signOutFirebase()
}
