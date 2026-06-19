'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, CalendarRange, Compass, Home, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils/cn'

// A curated 5-item subset of NAV_ITEMS for the mobile thumb zone (assessment +
// chat are reachable from the dashboard, so they stay out of the bottom bar).
const ITEMS = [
  { key: 'dashboard', href: 'dashboard', icon: Home },
  { key: 'results', href: 'results', icon: Sparkles },
  { key: 'plan', href: 'plan', icon: CalendarRange },
  { key: 'careers', href: 'career-explorer', icon: Compass },
  { key: 'checkIns', href: 'check-ins', icon: Activity },
] as const

/** Fixed bottom tab bar shown only on mobile (desktop uses the header nav). */
export function BottomNav({ locale, dict }: { locale: Locale; dict: Messages }) {
  const pathname = usePathname() || ''
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map((item) => {
          const href = `/${locale}/${item.href}`
          const active = pathname === href || pathname.startsWith(`${href}/`)
          const Icon = item.icon
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="w-full truncate text-center">{dict.nav[item.key]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
