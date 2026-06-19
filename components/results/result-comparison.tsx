'use client'

import * as React from 'react'
import { ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import type { Block } from '@/lib/methodology/assessment-items'
import { compareResults } from '@/lib/methodology/comparison'
import { getResultHistory } from '@/lib/data/assessment'
import type { StoredResult } from '@/lib/data/types'
import { MotionCard } from '@/components/motion/motion-card'

/** Non-judgmental comparison of the latest two attempts. Self-hides with < 2.
 *  `compact` renders a slim banner (keeps the reassurance + timeline, drops the grid). */
export function ResultComparison({
  locale,
  dict,
  compact = false,
}: {
  locale: Locale
  dict: Messages
  compact?: boolean
}) {
  const tc = dict.d4.compare
  const [history, setHistory] = React.useState<StoredResult[] | null>(null)

  React.useEffect(() => setHistory(getResultHistory()), [])

  if (!history || history.length < 2) return null

  const previous = history[history.length - 2]
  const current = history[history.length - 1]
  const cmp = compareResults(previous.score, current.score)
  const dateFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const delta = cmp.scoreDelta
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const blocks = (bs: Block[]) => bs.map((b) => dict.assessment.blocks[b]).join(', ')

  // Slim banner under the hero — doesn't compete with the focal readiness score.
  if (compact) {
    return (
      <div className="mt-4 rounded-2xl bg-accent/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{tc.title}</p>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <DeltaIcon className="h-4 w-4 text-primary" />
            {cmp.previousScore} → {cmp.currentScore}
            <span className="text-muted-foreground">
              ({delta > 0 ? '+' : ''}
              {delta})
            </span>
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{tc.reassure}</p>
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground">{tc.timeline}</p>
          <ol className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {history.map((r, i) => (
              <li key={r.resultId}>
                {i + 1}. {dateFmt.format(new Date(r.createdAt))} ·{' '}
                {dict.routes[r.score.primaryRoute].title} ({r.score.ipoPct100})
              </li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return (
    <MotionCard className="mt-5 p-6">
      <h2 className="text-lg font-semibold">{tc.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{tc.reassure}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">{tc.directionLabel}</p>
          {cmp.routeChanged ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm font-medium">
              {dict.routes[cmp.previousRoute].title}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              {dict.routes[cmp.currentRoute].title}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium">
              {dict.routes[cmp.currentRoute].title} · {tc.same}
            </p>
          )}
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">{tc.scoreLabel}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
            <DeltaIcon className="h-4 w-4 text-primary" />
            {cmp.previousScore} → {cmp.currentScore}
            <span className="text-muted-foreground">
              ({delta > 0 ? '+' : ''}
              {delta})
            </span>
          </p>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-xs font-medium text-muted-foreground">{tc.styleLabel}</p>
          {cmp.clusterChanged ? (
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm font-medium">
              {dict.clusters[cmp.previousCluster].title}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              {dict.clusters[cmp.currentCluster].title}
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium">
              {dict.clusters[cmp.currentCluster].title} · {tc.same}
            </p>
          )}
        </div>
      </div>

      {cmp.consistentStrengths.length > 0 ? (
        <p className="mt-4 text-sm">
          <span className="font-medium">{tc.consistentStrengths}:</span>{' '}
          <span className="text-muted-foreground">{blocks(cmp.consistentStrengths)}</span>
        </p>
      ) : null}
      {cmp.newGrowthAreas.length > 0 ? (
        <p className="mt-1 text-sm">
          <span className="font-medium">{tc.newGrowth}:</span>{' '}
          <span className="text-muted-foreground">{blocks(cmp.newGrowthAreas)}</span>
        </p>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground">{tc.timeline}</p>
        <ol className="mt-2 space-y-1.5">
          {history.map((r, i) => (
            <li key={r.resultId} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{dateFmt.format(new Date(r.createdAt))}</span>
              <span className="text-muted-foreground">·</span>
              <span>{dict.routes[r.score.primaryRoute].title}</span>
              <span className="text-muted-foreground">({r.score.ipoPct100}/100)</span>
            </li>
          ))}
        </ol>
      </div>
    </MotionCard>
  )
}
