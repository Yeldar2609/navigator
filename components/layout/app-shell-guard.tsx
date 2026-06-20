'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { useAuth } from '@/components/auth/auth-provider'
import { isDemoMode } from '@/lib/data/mode'

/**
 * Gate for the authenticated app shell. In Firebase mode an unauthenticated
 * visitor is redirected to sign-in — so e.g. pasting /admin (or /dashboard) into
 * a fresh browser with no session lands on sign-in, not a confusing shell that
 * looks signed-in. Demo/preview mode is open and is never gated.
 */
export function AppShellGuard({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const demo = isDemoMode()

  React.useEffect(() => {
    if (!demo && !loading && !user) {
      router.replace(`/${locale}/auth/sign-in`)
    }
  }, [demo, loading, user, locale, router])

  // Demo: open. Firebase + signed in: render. Otherwise show a spinner while auth
  // resolves / the redirect runs (never flash the protected content).
  if (demo || user) return <>{children}</>

  return (
    <div
      className="flex min-h-[40vh] items-center justify-center text-muted-foreground"
      aria-busy="true"
    >
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  )
}
