import Link from 'next/link'
import type { ReactNode } from 'react'
import { Compass } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { BottomNav } from './bottom-nav'
import { Container } from './container'
import { LanguageSwitcher } from './language-switcher'
import { SignOutButton } from './sign-out-button'
import { StudentNav } from './student-nav'

/** Authenticated student layout: header with nav + language switcher, content. */
export function AppShell({
  locale,
  dict,
  children,
}: {
  locale: Locale
  dict: Messages
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Compass className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">Kim Bolam</span>
            </Link>
            <div className="hidden md:block">
              <StudentNav locale={locale} dict={dict} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <SignOutButton locale={locale} label={dict.common.signOut} />
          </div>
        </Container>
      </header>
      <main id="main-content" tabIndex={-1} className="py-8 pb-24 sm:py-10 md:pb-10 focus:outline-none">
        <Container>{children}</Container>
      </main>
      <BottomNav locale={locale} dict={dict} />
    </div>
  )
}
