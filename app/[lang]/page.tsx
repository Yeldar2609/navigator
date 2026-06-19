import Link from 'next/link'
import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { TopBar } from '@/components/layout/top-bar'
import { buttonVariants } from '@/components/ui/button'
import { Hero } from '@/components/marketing/hero'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { Reassurance } from '@/components/marketing/reassurance'
import { ValueCards } from '@/components/marketing/value-cards'
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
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              {dict.common.signIn}
            </Link>
            <Link
              href={`/${locale}/auth/sign-up`}
              className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}
            >
              {dict.common.signUp}
            </Link>
          </div>
        }
      />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Hero locale={locale} dict={dict} />
        <ValueCards dict={dict} />
        <Reassurance dict={dict} />
        <HowItWorks dict={dict} />
        <footer className="border-t border-border/60 py-10">
          <Container className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <p>{dict.landing.footer.rights}</p>
            <p className="text-xs">{dict.landing.footer.methodology}</p>
          </Container>
        </footer>
      </main>
    </>
  )
}
