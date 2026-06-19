import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresh the Supabase auth session on each request and propagate updated
 * cookies. No-op (returns NextResponse.next) when Supabase env is missing, so
 * the app runs fine in preview mode.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // Touch the user to trigger a token refresh when needed.
  await supabase.auth.getUser()

  return response
}
