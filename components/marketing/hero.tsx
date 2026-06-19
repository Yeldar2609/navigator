'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { FloatingCards } from './floating-cards'

export function Hero({ locale, dict }: { locale: Locale; dict: Messages }) {
  const reduce = useReducedMotion()
  const h = dict.landing.hero
  return (
    <section className="relative overflow-hidden bg-hero">
      <FloatingCards />
      <Container className="relative py-20 sm:py-28">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {h.eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {h.title}
            <br />
            <span className="text-gradient">{h.titleAccent}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{h.subtitle}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={`/${locale}/auth/sign-up`} className={cn(buttonVariants({ size: 'lg' }), 'group')}>
              {h.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="#how" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              {h.ctaSecondary}
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
