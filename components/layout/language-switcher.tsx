'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { locales, localeShortLabels, type Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils/cn'

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname() || `/${locale}`

  function hrefFor(target: Locale): string {
    const parts = pathname.split('/')
    if (locales.includes(parts[1] as Locale)) {
      parts[1] = target
    } else {
      parts.splice(1, 0, target)
    }
    const next = parts.join('/')
    return next.startsWith('/') ? next : `/${next}`
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1"
      role="group"
      aria-label="Language"
    >
      {locales.map((l) => (
        <Link
          key={l}
          href={hrefFor(l)}
          aria-current={l === locale ? 'true' : undefined}
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
            l === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {localeShortLabels[l]}
        </Link>
      ))}
    </div>
  )
}
