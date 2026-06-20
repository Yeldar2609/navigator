'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Clock, Languages, Lock } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { Container } from '@/components/layout/container'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { HeroVisual } from './hero-visual'

export function Hero({ locale, dict }: { locale: Locale; dict: Messages }) {
  const reduce = useReducedMotion()
  const h = dict.landing.hero
  const chips = [
    { Icon: Languages, tone: 'from-accent to-accent-strong', ...h.chips.languages },
    { Icon: Clock, tone: 'from-primary to-primary-strong', ...h.chips.time },
    { Icon: Lock, tone: 'from-slate-600 to-slate-800', ...h.chips.privacy },
  ]
  return (
    <section className="relative overflow-hidden bg-hero">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* LEFT: copy */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-accent-strong shadow-soft">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary-soft))]" />
              {h.eyebrow}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {h.titleLead}
              <span className="text-primary">{h.titleRed}</span>
              {h.titleMid}
              <span className="text-accent">{h.titleBlue}</span>
              {h.titleEnd}
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium text-muted-foreground">{h.subtitle}</p>
            <div className="mt-8">
              <Link
                href={`/${locale}/auth/sign-up`}
                className={cn(buttonVariants({ size: 'lg' }), 'group w-full sm:w-auto')}
              >
                {h.ctaPrimary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent-soft text-accent">
                <Check className="h-3 w-3" strokeWidth={3.5} />
              </span>
              {h.underCta}
            </p>
            <div className="mt-8 grid max-w-xl gap-3.5 sm:grid-cols-3">
              {chips.map(({ Icon, tone, title, label }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <div
                    className={cn(
                      'mb-3 flex h-7 w-7 items-center justify-center rounded-[9px] bg-gradient-to-br text-white',
                      tone,
                    )}
                  >
                    <Icon className="h-[15px] w-[15px]" />
                  </div>
                  <div className="text-base font-extrabold tracking-tight">{title}</div>
                  <div className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT: decorative red+blue duotone composition */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-md lg:max-w-none"
          >
            <HeroVisual dict={dict} />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}
