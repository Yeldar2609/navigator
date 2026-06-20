import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { Container } from './container'
import { LanguageSwitcher } from './language-switcher'

/** Marketing/auth header: brand + language switcher + optional right slot. */
export function TopBar({ locale, right }: { locale: Locale; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-accent-strong text-sm font-extrabold text-primary-foreground shadow-soft">
            KB
          </span>
          Kim Bolam
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          {right}
          <LanguageSwitcher locale={locale} />
        </div>
      </Container>
    </header>
  )
}
