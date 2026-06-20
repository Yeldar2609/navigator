import Link from 'next/link'
import { locales, localeShortLabels, type Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils/cn'

/**
 * Landing header ported from variant-BG.html: KB gradient wordmark, a RU/KK/EN
 * language switch, and a "Войти" sign-in link. The language switch uses real
 * locale-aware links (/ru, /kk, /en); the active locale is highlighted. Kept a
 * server component because every link is derived from the `locale` prop.
 */
export function LandingHeader({ locale, dict }: { locale: Locale; dict: Messages }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <nav className="nav">
          <Link className="wordmark" href={`/${locale}`}>
            <span className="mark">KB</span>
            <span>
              Kim<span className="accent"> </span>Bolam
            </span>
          </Link>
          <div className="nav-right">
            <div className="lang" role="group" aria-label={dict.languageSwitcher.label}>
              {locales.map((l) => (
                <Link
                  key={l}
                  href={`/${l}`}
                  aria-current={l === locale ? 'true' : undefined}
                  className={cn(l === locale && 'active')}
                >
                  {localeShortLabels[l]}
                </Link>
              ))}
            </div>
            <Link className="signin" href={`/${locale}/auth/sign-in`}>
              {dict.common.signIn}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
