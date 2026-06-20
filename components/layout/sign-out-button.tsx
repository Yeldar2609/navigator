'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { Button } from '@/components/ui/button'
import { signOutClient } from '@/lib/auth/session'

/** Header sign-out control: clears the session then returns to the locale home. */
export function SignOutButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter()

  async function onSignOut() {
    await signOutClient()
    router.push(`/${locale}`)
  }

  return (
    <Button variant="ghost" size="sm" onClick={onSignOut} aria-label={label}>
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
