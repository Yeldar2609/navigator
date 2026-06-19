import { isDemoMode } from '@/lib/data/mode'
import { demoStore } from '@/lib/demo/store'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser'

export interface AuthResult {
  ok: boolean
  error?: string
}

/**
 * Sign in or sign up. In demo mode (no Supabase) this creates a local DEV-only
 * session — clearly NOT production auth. With Supabase configured, real auth runs.
 */
export async function signInOrUp(
  mode: 'sign-in' | 'sign-up',
  email: string,
  password: string,
): Promise<AuthResult> {
  if (isDemoMode()) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Navigator] DEMO MODE auth is active (DEV only). Configure Supabase env to use real authentication.',
    )
    demoStore.signIn(email)
    return { ok: true }
  }

  if (!isSupabaseConfigured()) return { ok: false, error: 'not_configured' }

  try {
    const supabase = createClient()
    const { error } =
      mode === 'sign-up'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch {
    return { ok: false, error: 'auth_failed' }
  }
}

export function getDemoUser() {
  return demoStore.getUser()
}

export async function signOutClient(): Promise<void> {
  if (isDemoMode()) {
    demoStore.signOut()
    return
  }
  if (isSupabaseConfigured()) {
    try {
      await createClient().auth.signOut()
    } catch {
      /* ignore */
    }
  }
}
