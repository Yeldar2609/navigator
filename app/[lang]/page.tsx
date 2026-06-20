import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { LandingHeader } from '@/components/marketing/landing-header'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Privacy } from '@/components/marketing/privacy'
import { Languages } from '@/components/marketing/languages'
import { FinalCta } from '@/components/marketing/final-cta'
import { SiteFooter } from '@/components/marketing/site-footer'
import './landing.css'

export default function LandingPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  return (
    <div className="kb-landing">
      <LandingHeader locale={locale} dict={dict} />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero locale={locale} dict={dict} />
        <Features dict={dict} />
        <HowItWorks dict={dict} />
        <Privacy dict={dict} />
        <Languages dict={dict} />
        <FinalCta locale={locale} dict={dict} />
        <SiteFooter locale={locale} dict={dict} />
      </main>
    </div>
  )
}
