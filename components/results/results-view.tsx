'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Bot, Info, Sparkles, Target } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { IPO_CRITERIA_KEYS } from '@/lib/methodology/awareness-index'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { SKILL_LABELS, SUBJECT_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import {
  groupRecommendations,
  type CareerRecommendation,
} from '@/lib/methodology/recommendations'
import { getLatestResult, retakeAssessment } from '@/lib/data/assessment'
import { generatePlan } from '@/lib/data/plan'
import type { StoredResult } from '@/lib/data/types'
import { useAuth } from '@/components/auth/auth-provider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RouteBadge } from '@/components/ui/route-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { ScoreRing } from '@/components/ui/score-ring'
import { MotionCard } from '@/components/motion/motion-card'
import { AnimatedProgressBar } from '@/components/motion/animated-progress-bar'
import { ConfidenceBoost } from '@/components/emotion/confidence-boost'
import { ResultComparison } from '@/components/results/result-comparison'
import { DownloadReportButton } from '@/components/reports/download-report-button'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

/** Full-width reveal band — fades up on scroll, no hover lift (honors reduced motion). */
function Band({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ResultsView({ locale, dict }: { locale: Locale; dict: Messages }) {
  const router = useRouter()
  const { hydrated } = useAuth()
  const tr = dict.d2.results
  const td = dict.d3
  const [result, setResult] = React.useState<StoredResult | null | undefined>(undefined)
  const [generating, setGenerating] = React.useState(false)

  // Only read the store once post-auth hydration has settled, so a returning
  // user reloading cold never sees the empty state before Firestore data lands.
  // While `!hydrated`, `result` stays `undefined` → the skeleton keeps showing.
  React.useEffect(() => {
    if (hydrated) setResult(getLatestResult())
  }, [hydrated])

  if (result === undefined) {
    return (
      <div className="mx-auto max-w-3xl" aria-busy="true" aria-label={tr.building}>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="mt-5 h-48 w-full rounded-2xl" />
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (result === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{dict.results.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{dict.results.subtitle}</p>
        <div className="mt-6">
          <EmptyState
            icon={<Sparkles className="h-6 w-6" />}
            title={dict.results.empty.title}
            description={dict.results.empty.body}
            action={
              <Link href={`/${locale}/assessment`} className={buttonVariants()}>
                {dict.results.empty.cta}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const score = result.score
  const routeTitle = (r: keyof Messages['routes']) => dict.routes[r].title

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
    router.push(`/${locale}/plan`)
  }

  function retake() {
    retakeAssessment()
    router.push(`/${locale}/assessment`)
  }

  function reasonsFor(rec: CareerRecommendation): string[] {
    const out: string[] = []
    if (rec.matchedRoute) out.push(interpolate(tr.reasonRoute, { route: routeTitle(rec.route) }))
    if (rec.matchedClusters.length)
      out.push(interpolate(tr.reasonCluster, { cluster: dict.clusters[rec.matchedClusters[0]].title }))
    for (const s of rec.matchedSubjects.slice(0, 2))
      out.push(interpolate(tr.reasonSubject, { subject: labelFor(SUBJECT_LABELS, s, locale) }))
    return out.slice(0, 3)
  }

  // Quiet ranked row: name + match% always visible; the "why" detail is on demand.
  function renderCareer(rec: CareerRecommendation) {
    const career = CAREERS_BY_SLUG[rec.slug]
    const name = career?.name[locale] ?? rec.slug
    const match = Math.min(100, Math.round(rec.score))
    return (
      <li key={rec.slug} className="border-b border-border/60 py-4 last:border-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-semibold">{name}</p>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">{td.confidenceLevel[rec.confidenceLevel]}</Badge>
            <Badge variant="default">
              {match}% {tr.matchLabel}
            </Badge>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reasonsFor(rec).map((reason, i) => (
            <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {reason}
            </span>
          ))}
        </div>
        <details className="mt-2">
          <summary className="inline-flex cursor-pointer list-none items-center text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
            {tr.whyRecommended}
          </summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{td.learnNext}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {rec.skillGaps.map((s) => (
                  <span key={s} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">
                    {labelFor(SKILL_LABELS, s, locale)}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{td.firstAction}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {interpolate(tr.nextStepRoute, { route: routeTitle(rec.route) })}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs italic text-muted-foreground">{td.howCalculated.careerNote}</p>
        </details>
      </li>
    )
  }

  const groups = groupRecommendations(result.recommendations)
  const buckets = [
    { key: 'recommended' as const, items: groups.recommended, label: td.buckets.recommended },
    { key: 'exploratory' as const, items: groups.exploratory, label: td.buckets.exploratory },
    { key: 'stretch' as const, items: groups.stretch, label: td.buckets.stretch },
  ].filter((b) => b.items.length > 0)

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero — focal readiness score */}
      <MotionCard delay={0} className="overflow-hidden">
        <div className="grid items-center gap-6 bg-gradient-to-br from-primary-soft to-card p-7 sm:grid-cols-[1fr_auto]">
          <div>
            <Badge variant="accent">
              <Sparkles className="h-3.5 w-3.5" />
              {dict.results.title}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{tr.heroTitle}</h1>
            <p className="mt-2 text-muted-foreground">{tr.heroSubtitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tr.reassure}</p>
            <div className="mt-4">
              <RouteBadge route={score.primaryRoute} label={dict.routes[score.primaryRoute].title} />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <ScoreRing value={score.ipoPct100} label={tr.readinessScore} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {dict.results.awareness[score.awarenessLevel]}
            </p>
          </div>
        </div>
      </MotionCard>

      {/* Compact retake delta — doesn't compete with the focal score */}
      <ResultComparison locale={locale} dict={dict} compact />

      {/* Readiness band — one luminous track + inline criteria (replaces 6 stacked bars) */}
      <Band delay={0.05} className="mt-6 rounded-2xl bg-primary-soft/40 p-6">
        <h2 className="text-lg font-semibold">{td.breakdownTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{td.explain[score.awarenessLevel]}</p>
        <div className="mt-4">
          <AnimatedProgressBar value={score.ipoPct100} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm">
          {IPO_CRITERIA_KEYS.map((key) => (
            <span key={key} className="text-muted-foreground">
              {td.criteria[key]}{' '}
              <span className="font-medium tabular-nums text-foreground">
                {score.ipoCriteria[key]}/10
              </span>
            </span>
          ))}
        </div>

        {/* Methodology transparency — explains the score on demand (builds trust) */}
        <details className="group mt-5 border-t border-primary-soft/60 pt-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
            <Info className="h-3.5 w-3.5" />
            {td.howCalculated.trigger}
          </summary>
          <div className="mt-3 space-y-4 text-sm text-muted-foreground">
            <p>{td.howCalculated.scoreIntro}</p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                {td.howCalculated.criteriaHeading}
              </p>
              <ul className="mt-2 space-y-1.5">
                {IPO_CRITERIA_KEYS.map((key) => (
                  <li key={key} className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="font-medium text-foreground">{td.criteria[key]}</span>
                      {' — '}
                      {td.howCalculated.criteriaDesc[key]}
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground">
                      {score.ipoCriteria[key]}/10
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
                {td.howCalculated.careersHeading}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {(['direction', 'styles', 'interests', 'relevance'] as const).map((k) => (
                  <li key={k}>{td.howCalculated.careersFactors[k]}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs italic">{td.howCalculated.trustNote}</p>
          </div>
        </details>
      </Band>

      {/* Direction band */}
      <Band delay={0.1} className="mt-8">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Target className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">{tr.yourDirection}</h2>
        <p className="mt-1 font-medium">{dict.routes[score.primaryRoute].title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.routes[score.primaryRoute].description}
        </p>
      </Band>

      <hr className="my-8 border-primary-soft" />

      {/* Why this direction fits — strengths/growth + clusters */}
      <Band delay={0.15}>
        <h2 className="text-lg font-semibold">{tr.whyThisFits}</h2>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tr.yourStrengths}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {score.strengths.map((b) => (
                <Badge key={b} variant="success">
                  {dict.assessment.blocks[b]}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tr.areasToGrow}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {score.growthAreas.map((b) => (
                <Badge key={b} variant="outline">
                  {dict.assessment.blocks[b]}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {tr.yourClusters}
            </p>
            <ul className="mt-2 space-y-2">
              {[score.primaryCluster, score.secondaryCluster].map((c, i) => (
                <li key={c}>
                  <p className="text-sm font-medium">
                    {i + 1}. {dict.clusters[c].title}
                  </p>
                  <p className="text-xs text-muted-foreground">{dict.clusters[c].description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <hr className="my-8 border-border/60" />

      {/* Careers — quiet ranked list, details on demand */}
      <Band delay={0.2}>
        {buckets.map((bucket, bi) => (
          <div key={bucket.key} className={bi > 0 ? 'mt-6' : ''}>
            <h2 className="text-lg font-semibold">{bucket.label}</h2>
            {bi === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">{tr.curatedRelevance}</p>
            ) : null}
            <ul className="mt-2">{bucket.items.map((rec) => renderCareer(rec))}</ul>
          </div>
        ))}
      </Band>

      {/* What this means — supportive note, not a card */}
      <ConfidenceBoost className="mt-8" message={tr.whatThisMeansBody} />

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={buildPlan} disabled={generating} className="group">
          {generating ? dict.common.loading : tr.buildPlanCta}
          {!generating && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </Button>
        <Link
          href={`/${locale}/chat`}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          <Bot className="h-4 w-4" />
          {tr.askCounselorCta}
        </Link>
        <DownloadReportButton locale={locale} dict={dict} />
        <Button variant="ghost" size="lg" onClick={retake}>
          {dict.d4.retake}
        </Button>
      </div>
    </div>
  )
}
