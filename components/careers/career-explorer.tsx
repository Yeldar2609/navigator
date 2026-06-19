'use client'

import * as React from 'react'
import Link from 'next/link'
import { Bot, Search } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { CAREERS } from '@/lib/methodology/careers-data'
import { relatedMajorsFor } from '@/lib/methodology/majors-data'
import { CLUSTERS } from '@/lib/methodology/clusters'
import { ROUTES } from '@/lib/methodology/routes'
import { SUBJECT_KEYS } from '@/lib/onboarding/options'
import { SKILL_LABELS, SUBJECT_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import { getLatestResult } from '@/lib/data/assessment'
import type { StoredResult } from '@/lib/data/types'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RouteBadge } from '@/components/ui/route-badge'
import { MotionCard } from '@/components/motion/motion-card'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

export function CareerExplorer({ locale, dict }: { locale: Locale; dict: Messages }) {
  const te = dict.d3.explorer
  const [query, setQuery] = React.useState('')
  const [routeF, setRouteF] = React.useState('all')
  const [clusterF, setClusterF] = React.useState('all')
  const [subjectF, setSubjectF] = React.useState('all')
  const [selected, setSelected] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<StoredResult | null>(null)

  React.useEffect(() => setResult(getLatestResult()), [])

  const filtered = CAREERS.filter((c) => {
    if (query && !c.name[locale].toLowerCase().includes(query.toLowerCase())) return false
    if (routeF !== 'all' && c.route !== routeF) return false
    if (clusterF !== 'all' && !(c.clusterBias as string[]).includes(clusterF)) return false
    if (subjectF !== 'all' && !c.subjectTags.includes(subjectF)) return false
    return true
  })

  const primaryRoute = result?.score.primaryRoute
  const sel = selected ? CAREERS.find((c) => c.slug === selected) : null

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 text-center">
        <h1 className="text-2xl font-bold">{te.title}</h1>
        <p className="mt-1.5 text-muted-foreground">{te.subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={te.searchPlaceholder}
            className="pl-9"
            aria-label={te.searchPlaceholder}
          />
        </div>
        <Select value={routeF} onChange={(e) => setRouteF(e.target.value)} aria-label={te.filterRoute}>
          <option value="all">
            {te.filterRoute}: {te.all}
          </option>
          {ROUTES.map((r) => (
            <option key={r} value={r}>
              {dict.routes[r].title}
            </option>
          ))}
        </Select>
        <Select value={clusterF} onChange={(e) => setClusterF(e.target.value)} aria-label={te.filterCluster}>
          <option value="all">
            {te.filterCluster}: {te.all}
          </option>
          {CLUSTERS.map((c) => (
            <option key={c} value={c}>
              {dict.clusters[c].title}
            </option>
          ))}
        </Select>
        <Select value={subjectF} onChange={(e) => setSubjectF(e.target.value)} aria-label={te.filterSubject}>
          <option value="all">
            {te.filterSubject}: {te.all}
          </option>
          {SUBJECT_KEYS.map((s) => (
            <option key={s} value={s}>
              {labelFor(SUBJECT_LABELS, s, locale)}
            </option>
          ))}
        </Select>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {interpolate(te.countLabel, { count: filtered.length })}
      </p>

      {sel ? (
        <MotionCard className="mt-3 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">{sel.name[locale]}</h2>
              <div className="mt-2">
                <RouteBadge route={sel.route} label={dict.routes[sel.route].title} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={te.close}
              className="rounded-full px-2 text-sm text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">{te.aboutDirection}</p>
          <p className="text-sm text-muted-foreground">{dict.routes[sel.route].description}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{te.subjectsToFocus}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {sel.subjectTags.map((s) => (
                  <Badge key={s} variant="secondary">
                    {labelFor(SUBJECT_LABELS, s, locale)}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{te.skillsToBuild}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {sel.skillTags.map((s) => (
                  <Badge key={s} variant="default">
                    {labelFor(SKILL_LABELS, s, locale)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {primaryRoute ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs font-semibold text-primary">{te.whyMightFit}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {sel.route === primaryRoute ? te.fitsYou : dict.routes[sel.route].description}
              </p>
            </div>
          ) : null}
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground">{te.relatedMajors}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {relatedMajorsFor(sel).map((m) => (
                <Badge key={m.slug} variant="outline">
                  {m.name[locale]}
                </Badge>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{dict.d2.results.curatedRelevance}</p>
          <Link
            href={`/${locale}/chat`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}
          >
            <Bot className="h-4 w-4" />
            {te.askCounselor}
          </Link>
        </MotionCard>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">{te.noResults}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelected(c.slug)}
              className="rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{c.name[locale]}</p>
                {primaryRoute === c.route ? <Badge variant="success">{te.fitsYou}</Badge> : null}
              </div>
              <div className="mt-2">
                <RouteBadge route={c.route} label={dict.routes[c.route].title} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.subjectTags.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {labelFor(SUBJECT_LABELS, s, locale)}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
