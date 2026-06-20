'use client'

import * as React from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/components/auth/auth-provider'
import { isDemoMode } from '@/lib/data/mode'
import { getDemoUser } from '@/lib/auth/session'
import { SignOutButton } from './sign-out-button'

/**
 * Header auth control: shows "Sign out" only when actually signed in, and "Sign
 * in" otherwise. Fixes the phantom sign-out button that appeared for visitors who
 * were not signed in. Firebase mode uses the verified auth state; demo/preview
 * uses the local demo session.
 */
export function AuthButton({
  locale,
  signInLabel,
  signOutLabel,
}: {
  locale: Locale
  signInLabel: string
  signOutLabel: string
}) {
  const { user, loading } = useAuth()
  const demo = isDemoMode()
  const [demoSignedIn, setDemoSignedIn] = React.useState(false)

  React.useEffect(() => {
    if (demo) setDemoSignedIn(Boolean(getDemoUser()))
  }, [demo, loading])

  // Avoid a wrong-state flash while Firebase auth is still resolving.
  if (!demo && loading) return null

  const signedIn = demo ? demoSignedIn : Boolean(user)

  return signedIn ? (
    <SignOutButton locale={locale} label={signOutLabel} />
  ) : (
    <Link
      href={`/${locale}/auth/sign-in`}
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">{signInLabel}</span>
    </Link>
  )
}
