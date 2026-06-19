import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

/**
 * Server-side Supabase client bound to the request cookies. Call inside Server
 * Components, Route Handlers, and Server Actions. Throws if env is missing —
 * callers that must not crash should check `isSupabaseConfigured()` first.
 */
export function createClient() {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
    )
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // In a Server Component the cookie store is read-only; the middleware
        // refreshes the session, so swallowing this is safe.
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          /* called from a Server Component — ignore */
        }
      },
    },
  })
}
