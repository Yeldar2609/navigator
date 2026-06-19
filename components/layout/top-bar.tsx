import Link from 'next/link'
import type { ReactNode } from 'react'
import { Compass } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { Container } from './container'
import { LanguageSwitcher } from './language-switcher'

/** Marketing/auth header: brand + language switcher + optional right slot. */
export function TopBar({ locale, right }: { locale: Locale; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Compass className="h-4 w-4" />
          </span>
          Navigator
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          {right}
          <LanguageSwitcher locale={locale} />
        </div>
      </Container>
    </header>
  )
}
