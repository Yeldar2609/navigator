'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  CalendarRange,
  Check,
  Compass,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { getLatestResult, getSavedAnswers, TOTAL_QUESTIONS } from '@/lib/data/assessment'
import { getProfile } from '@/lib/data/profile'
import {
  generatePlan,
  getPlan,
  nextPlanItem,
  planProgress,
  setPlanItemStatus,
} from '@/lib/data/plan'
import type { StoredPlan, StoredProfile, StoredResult } from '@/lib/data/types'
import { useAuth } from '@/components/auth/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RouteBadge } from '@/components/ui/route-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScoreRing } from '@/components/ui/score-ring'
import { MotionCard } from '@/components/motion/motion-card'
import { ConfidenceBoost } from '@/components/emotion/confidence-boost'
import { SmallWin } from '@/components/emotion/small-win'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

/** "Your path today" — the calm post-assessment home that stitches the next
 *  step, readiness, and top match into one place. Reads the local store. */
export function DashboardView({ locale, dict }: { locale: Locale; dict: Messages }) {
  const router = useRouter()
  const { hydrated } = useAuth()
  const dd = dict.d3.dashboard
  const tr = dict.d2.results

  const [ready, setReady] = React.useState(false)
  const [profile, setProfile] = React.useState<StoredProfile | null>(null)
  const [result, setResult] = React.useState<StoredResult | null>(null)
  const [plan, setPlan] = React.useState<StoredPlan | null>(null)
  const [answered, setAnswered] = React.useState(0)
  const [generating, setGenerating] = React.useState(false)
  const [justWon, setJustWon] = React.useState(false)
  const winTimer = React.useRef<number | null>(null)

  const refresh = React.useCallback(() => {
    setProfile(getProfile())
    setResult(getLatestResult())
    setPlan(getPlan())
    setAnswered(Object.keys(getSavedAnswers()).length)
    setReady(true)
  }, [])

  // Wait for post-auth hydration before reading the store, so a returning user
  // reloading cold never flashes the "take the test" invite against an empty
  // cache. `hydrated` resolves promptly in demo mode (no user to hydrate).
  React.useEffect(() => {
    if (hydrated) refresh()
  }, [hydrated, refresh])

  React.useEffect(
    () => () => {
      if (winTimer.current) window.clearTimeout(winTimer.current)
    },
    [],
  )

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 grid gap-5 sm:grid-cols-[auto_1fr]">
          <Skeleton className="h-48 w-full rounded-2xl sm:w-48" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <Skeleton className="mt-5 h-32 w-full rounded-2xl" />
      </div>
    )
  }

  const name = profile?.displayName?.trim()
  const header = (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">
        {name ? interpolate(dd.greeting, { name }) : dd.greetingGeneric}
      </h1>
      <p className="mt-1.5 text-muted-foreground">{dd.subtitle}</p>
    </div>
  )

  // No result yet → invite to start (or resume) the assessment.
  if (!result) {
    const inProgress = answered > 0
    return (
      <div className="mx-auto max-w-3xl">
        {header}
        <MotionCard delay={0.05} className="mt-6 overflow-hidden">
          <div className="bg-gradient-to-br from-primary-soft to-card p-7">
            <Badge variant="accent">
              <Sparkles className="h-3.5 w-3.5" />
              {dict.results.title}
            </Badge>
            <h2 className="mt-3 text-xl font-semibold">
              {inProgress ? dd.resumeTitle : dd.startTitle}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {inProgress
                ? interpolate(dd.resumeBody, { answered, total: TOTAL_QUESTIONS })
                : dd.startBody}
            </p>
            <Link href={`/${locale}/assessment`} className={cn(buttonVariants({ size: 'lg' }), 'mt-5 group')}>
              {inProgress ? dd.resumeCta : dd.startCta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </MotionCard>
      </div>
    )
  }

  const score = result.score
  const next = plan ? nextPlanItem(plan) : null
  const progress = plan ? planProgress(plan) : 0
  const topMatch =
    result.recommendations.find((r) => r.bucket === 'recommended') ?? result.recommendations[0]

  async function buildPlan() {
    setGenerating(true)
    await generatePlan({
      resultId: result!.resultId,
      route: score.primaryRoute,
      routeModifier: score.routeModifier,
      horizonMonths: 1,
      locale,
      routeTitle: dict.routes[score.primaryRoute].title,
    })
    refresh()
    setGenerating(false)
  }

  async function completeStep(id: string) {
    await setPlanItemStatus(id, 'done')
    setJustWon(true)
    if (winTimer.current) window.clearTimeout(winTimer.current)
    winTimer.current = window.setTimeout(() => setJustWon(false), 1500)
    refresh()
  }

  const quickLinks = [
    { href: 'results', label: dd.linkResults, icon: Sparkles },
    { href: 'plan', label: dd.linkPlan, icon: CalendarRange },
    { href: 'career-explorer', label: dd.linkCareers, icon: Compass },
    { href: 'check-ins', label: dd.linkCheckIn, icon: Activity },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      {header}

      <div className="mt-4">
        <ConfidenceBoost message={dict.d3.explain[score.awarenessLevel]} />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-[auto_1fr]">
        {/* Readiness + direction */}
        <MotionCard delay={0} className="flex flex-col items-center p-6 text-center">
          <ScoreRing value={score.ipoPct100} label={tr.readinessScore} size={140} />
          <p className="mt-2 text-xs text-muted-foreground">
            {dict.results.awareness[score.awarenessLevel]}
          </p>
          <div className="mt-3">
            <RouteBadge route={score.primaryRoute} label={dict.routes[score.primaryRoute].title} />
          </div>
        </MotionCard>

        {/* Today's step */}
        <MotionCard delay={0.05} className="bg-gradient-to-br from-primary-soft to-card p-6">
          <p className="text-sm font-semibold text-primary">{dd.stepTodayTitle}</p>
          {plan ? (
            next ? (
              <>
                <p className="mt-2 text-lg font-medium">{next.title}</p>
                <Button size="sm" className="mt-3" onClick={() => completeStep(next.id)}>
                  <Check className="h-4 w-4" />
                  {dd.markDone}
                </Button>
                <div className="mt-2">
                  <SmallWin show={justWon} label={dict.d3.plan.smallWin} />
                </div>
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <Link
                    href={`/${locale}/plan`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    {dd.linkPlan}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-2 text-lg font-medium">{dd.stepTodayDone}</p>
            )
          ) : (
            <>
              <p className="mt-2 font-medium">{dd.noPlanTitle}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dd.noPlanBody}</p>
              <Button size="sm" className="mt-3 group" onClick={buildPlan} disabled={generating}>
                {generating ? dict.common.loading : dd.buildPlanCta}
                {!generating && (
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </>
          )}
        </MotionCard>
      </div>

      {/* Top match */}
      {topMatch ? (
        <MotionCard delay={0.1} className="mt-5 p-6">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{dd.topMatchTitle}</h2>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {CAREERS_BY_SLUG[topMatch.slug]?.name[locale] ?? topMatch.slug}
              </p>
              <p className="text-sm text-muted-foreground">
                {dict.routes[topMatch.route].title}
              </p>
            </div>
            <Badge variant="default">
              {Math.min(100, Math.round(topMatch.score))}% {dd.matchLabel}
            </Badge>
          </div>
          <Link
            href={`/${locale}/career-explorer`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}
          >
            {dd.exploreMoreCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </MotionCard>
      ) : null}

      {/* Quick links */}
      <div className="mt-5">
        <p className="mb-2 text-sm font-medium text-muted-foreground">{dd.quickLinksTitle}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={`/${locale}/${link.href}`}
                className="flex flex-col items-start gap-2 rounded-2xl border bg-card p-4 shadow-soft transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Check-in nudge */}
      <MotionCard delay={0.15} className="mt-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">{dd.checkInTitle}</p>
              <p className="text-sm text-muted-foreground">{dd.checkInBody}</p>
            </div>
          </div>
          <Link
            href={`/${locale}/check-ins`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            {dd.checkInCta}
          </Link>
        </div>
      </MotionCard>
    </div>
  )
}
