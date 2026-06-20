import Link from 'next/link'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { TopBar } from '@/components/layout/top-bar'
import { buttonVariants } from '@/components/ui/button'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Privacy } from '@/components/marketing/privacy'
import { Languages } from '@/components/marketing/languages'
import { FinalCta } from '@/components/marketing/final-cta'
import { SiteFooter } from '@/components/marketing/site-footer'
import { cn } from '@/lib/utils/cn'

export default function LandingPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <>
      <TopBar
        locale={locale}
        right={
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/auth/sign-in`}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'hidden font-bold text-accent hover:text-primary sm:inline-flex',
              )}
            >
              {dict.common.signIn}
            </Link>
          </div>
        }
      />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero locale={locale} dict={dict} />
        <Features dict={dict} />
        <HowItWorks dict={dict} />
        <Privacy dict={dict} />
        <Languages dict={dict} />
        <FinalCta locale={locale} dict={dict} />
        <SiteFooter locale={locale} dict={dict} />
      </main>
    </>
  )
}
