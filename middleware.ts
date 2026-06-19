import { NextResponse, type NextRequest } from 'next/server'
import { defaultLocale, locales } from '@/lib/i18n/config'
import { updateSession } from '@/lib/supabase/middleware'

function hasLocalePrefix(pathname: string): boolean {
  return locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1) Locale routing: redirect un-prefixed paths to the default locale.
  if (!hasLocalePrefix(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`
    return NextResponse.redirect(url)
  }

  // 2) Refresh the Supabase session on localized routes.
  return updateSession(request)
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
