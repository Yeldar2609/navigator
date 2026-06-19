'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { NAV_ITEMS } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'

export function StudentNav({ locale, dict }: { locale: Locale; dict: Messages }) {
  const pathname = usePathname() || ''
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const href = `/${locale}/${item.href}`
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={item.key}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary-soft text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {dict.nav[item.key]}
          </Link>
        )
      })}
    </nav>
  )
}
