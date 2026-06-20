import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export function FinalCta({ locale, dict }: { locale: Locale; dict: Messages }) {
  const c = dict.landing.finalCta
  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] border border-border bg-gradient-to-br from-white to-accent-soft p-12 text-center shadow-soft sm:p-16">
          {/* soft red glow */}
          <div className="pointer-events-none absolute -bottom-28 left-1/2 h-72 w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.12),transparent_65%)]" />
          <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-[2.5rem]">
            {c.title}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg font-medium text-muted-foreground">
            {c.body}
          </p>
          <div className="relative mt-8">
            <Link
              href={`/${locale}/auth/sign-up`}
              className={cn(buttonVariants({ size: 'lg' }), 'group w-full sm:w-auto')}
            >
              {c.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <p className="relative mt-4 text-sm font-semibold text-muted-foreground">{c.note}</p>
        </div>
      </Container>
    </section>
  )
}
