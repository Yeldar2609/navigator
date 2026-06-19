'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarRange, Check } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { PLAN_HORIZONS, type PlanHorizon } from '@/lib/methodology/plan-templates'
import { getLatestResult } from '@/lib/data/assessment'
import {
  generatePlan,
  getPlan,
  nextPlanItem,
  planProgress,
  setPlanItemStatus,
} from '@/lib/data/plan'
import type { PlanItemStatus, StoredPlan, StoredResult } from '@/lib/data/types'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { ScoreRing } from '@/components/ui/score-ring'
import { Milestone } from '@/components/emotion/milestone'
import { SmallWin } from '@/components/emotion/small-win'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

export function PlanView({ locale, dict }: { locale: Locale; dict: Messages }) {
  const tp = dict.d2.plan
  const tpp = dict.d3.plan
  const [plan, setPlan] = React.useState<StoredPlan | null | undefined>(undefined)
  const [result, setResult] = React.useState<StoredResult | null>(null)
  const [activeMonth, setActiveMonth] = React.useState(1)
  const [busyHorizon, setBusyHorizon] = React.useState(false)
  const [justWon, setJustWon] = React.useState(false)
  const winTimer = React.useRef<number | null>(null)

  React.useEffect(() => {
    setPlan(getPlan())
    setResult(getLatestResult())
  }, [])

  React.useEffect(
    () => () => {
      if (winTimer.current) window.clearTimeout(winTimer.current)
    },
    [],
  )

  if (plan === undefined) return <LoadingState />

  if (plan === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{dict.plan.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{dict.plan.subtitle}</p>
        <div className="mt-6">
          <EmptyState
            icon={<CalendarRange className="h-6 w-6" />}
            title={dict.plan.empty.title}
            description={dict.plan.empty.body}
            action={
              <Link href={`/${locale}/results`} className={buttonVariants({ variant: 'outline' })}>
                {dict.plan.empty.cta}
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const total = plan.items.length
  const done = plan.items.filter((i) => i.status === 'done').length
  const progress = planProgress(plan)
  const complete = total > 0 && done === total
  const next = nextPlanItem(plan)
  const month = plan.months.find((m) => m.monthIndex === activeMonth) ?? plan.months[0]
  const monthItems = plan.items.filter((i) => i.monthIndex === month.monthIndex)

  async function toggle(id: string, status: PlanItemStatus) {
    const nextStatus: PlanItemStatus = status === 'done' ? 'todo' : 'done'
    const updated = await setPlanItemStatus(id, nextStatus)
    if (updated) setPlan({ ...updated })
    if (nextStatus === 'done') {
      setJustWon(true)
      if (winTimer.current) window.clearTimeout(winTimer.current)
      winTimer.current = window.setTimeout(() => setJustWon(false), 1500)
    }
  }

  async function changeHorizon(h: PlanHorizon) {
    if (h === plan!.horizonMonths || !result || busyHorizon) return
    setBusyHorizon(true)
    const updated = await generatePlan({
      resultId: result.resultId,
      route: result.score.primaryRoute,
      routeModifier: result.score.routeModifier,
      horizonMonths: h,
      locale,
      routeTitle: dict.routes[result.score.primaryRoute].title,
    })
    setPlan({ ...updated })
    setResult(getLatestResult())
    setActiveMonth(1)
    setBusyHorizon(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">{dict.plan.title}</h1>
      <p className="mt-1.5 text-muted-foreground">{tp.generatedNote}</p>

      {/* Horizon selector */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">{dict.plan.chooseHorizon}</p>
        <div className="flex flex-wrap gap-2">
          {PLAN_HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => changeHorizon(h)}
              disabled={busyHorizon || !result}
              aria-pressed={plan.horizonMonths === h}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50',
                plan.horizonMonths === h
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border hover:bg-muted',
              )}
            >
              {dict.plan.horizon[h]}
            </button>
          ))}
        </div>
        {result ? null : (
          <p className="mt-2 text-xs text-muted-foreground">{tpp.regenerateNote}</p>
        )}
      </div>

      {/* Progress + this-week */}
      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center rounded-2xl border bg-card p-5 shadow-soft">
          <ScoreRing value={progress} label={tpp.progressTitle} size={120} />
          <p className="mt-1 text-xs text-muted-foreground">
            {interpolate(tp.progressLabel, { done, total })}
          </p>
        </div>
        <div className="rounded-2xl border bg-gradient-to-br from-primary-soft to-card p-5 shadow-soft">
          <p className="text-sm font-semibold text-primary">{tpp.thisWeekTitle}</p>
          {next ? (
            <>
              <p className="mt-2 font-medium">{next.title}</p>
              <button
                type="button"
                onClick={() => toggle(next.id, next.status)}
                className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}
              >
                <Check className="h-4 w-4" />
                {tp.markDone}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">{tpp.notBehind}</p>
            </>
          ) : (
            <p className="mt-2 font-medium">{tpp.thisWeekDone}</p>
          )}
          <div className="mt-2">
            <SmallWin show={justWon} label={tpp.smallWin} />
          </div>
        </div>
      </div>

      {complete ? (
        <Milestone
          className="mt-5"
          title={tp.celebrationTitle}
          body={tp.celebrationBody}
          action={
            <Link href={`/${locale}/check-ins`} className={buttonVariants()}>
              {tp.checkInCta}
            </Link>
          }
        />
      ) : null}

      {/* Monthly tabs */}
      {plan.months.length > 1 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {plan.months.map((m) => (
            <button
              key={m.monthIndex}
              type="button"
              onClick={() => setActiveMonth(m.monthIndex)}
              aria-pressed={activeMonth === m.monthIndex}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                activeMonth === m.monthIndex
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {interpolate(tpp.monthTab, { n: m.monthIndex })}
            </button>
          ))}
        </div>
      ) : null}

      {/* Active month */}
      <div className="mt-4 rounded-2xl border bg-card p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {interpolate(tpp.monthTab, { n: month.monthIndex })}
        </p>
        <h2 className="mt-1 text-lg font-bold">{month.theme}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium">{tpp.goalLabel}:</span> {month.goal}
        </p>

        <ul className="mt-4 space-y-2">
          {monthItems.map((it) => {
            const isDone = it.status === 'done'
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => toggle(it.id, it.status)}
                  aria-pressed={isDone}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                    isDone ? 'border-success/40 bg-success/5' : 'border-border hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      isDone
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {isDone && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {interpolate(tpp.weekLabel, { n: it.weekIndex })} · {tpp.categories[it.category]}
                    </span>
                    <span className={cn('text-sm', isDone && 'text-muted-foreground line-through')}>
                      {it.title}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-4 grid gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-2">
          <p className="text-sm">
            <span className="font-medium">{tpp.reflectionLabel}:</span>{' '}
            <span className="text-muted-foreground">{month.reflectionPrompt}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium">{tpp.metricLabel}:</span>{' '}
            <span className="text-muted-foreground">{month.successMetric}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
