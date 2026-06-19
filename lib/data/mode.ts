import { isSupabaseConfigured } from '@/lib/supabase/browser'

/**
 * Demo mode = DEV-only local auth + localStorage persistence + client scoring.
 *
 * Fail-CLOSED in production: if a production build is missing Supabase env, demo
 * does NOT silently activate (that would grant fake auth). It must be explicitly
 * opted in with NEXT_PUBLIC_DEMO_MODE=on at build time. In development it stays
 * on by default when Supabase is unconfigured, so `npm run dev` is zero-setup.
 *
 * Note: NEXT_PUBLIC_* vars are inlined at build time. To ship a *production*
 * demo (e.g. the e2e server), build with NEXT_PUBLIC_DEMO_MODE=on.
 */
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'off') return false
  if (isSupabaseConfigured()) return false
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_DEMO_MODE === 'on'
  }
  return true
}
