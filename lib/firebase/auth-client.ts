// Client-side Firebase Auth wrapper. Used by the auth UI and session layer when
// Firebase is configured. Returns a stable { ok, error } shape so callers don't
// depend on Firebase error objects. No-ops gracefully when unconfigured.
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'

export interface AuthOutcome {
  ok: boolean
  error?: string
  uid?: string
}

/** Map Firebase auth error codes to the app's existing generic error buckets. */
function mapError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
    case 'auth/missing-password':
    case 'auth/weak-password':
      return 'invalid'
    case 'auth/email-already-in-use':
      return 'email_in_use'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'bad_credentials'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'cancelled'
    default:
      return 'auth_failed'
  }
}

export async function emailSignInOrUp(
  mode: 'sign-in' | 'sign-up',
  email: string,
  password: string,
): Promise<AuthOutcome> {
  const auth = getFirebaseAuth()
  if (!auth) return { ok: false, error: 'not_configured' }
  try {
    const cred =
      mode === 'sign-up'
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password)
    return { ok: true, uid: cred.user.uid }
  } catch (e) {
    return { ok: false, error: mapError((e as { code?: string }).code) }
  }
}

export async function googleSignIn(): Promise<AuthOutcome> {
  const auth = getFirebaseAuth()
  if (!auth) return { ok: false, error: 'not_configured' }
  try {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return { ok: true, uid: cred.user.uid }
  } catch (e) {
    return { ok: false, error: mapError((e as { code?: string }).code) }
  }
}

export async function signOutFirebase(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) return
  try {
    await firebaseSignOut(auth)
  } catch {
    /* ignore */
  }
}

export function currentFirebaseUser(): User | null {
  return getFirebaseAuth()?.currentUser ?? null
}

/** Subscribe to auth-state changes. Returns an unsubscribe fn (no-op if unconfigured). */
export function onFirebaseAuthChange(cb: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth()
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, cb)
}

/** Fresh ID token for the current user (for Authorization: Bearer on server calls). */
export async function getIdToken(): Promise<string | null> {
  const user = getFirebaseAuth()?.currentUser
  return user ? user.getIdToken() : null
}
