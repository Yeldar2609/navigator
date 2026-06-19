'use client'

import * as React from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, Printer, Users, X } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import type { Block } from '@/lib/methodology/assessment-items'
import type { Cluster } from '@/lib/methodology/clusters'
import { ROUTES } from '@/lib/methodology/routes'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { GRADES } from '@/lib/utils/constants'
import {
  DEMO_STUDENTS,
  needsSupport,
  summarize,
  type AdminStudent,
} from '@/lib/admin/demo-students'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { RouteBadge } from '@/components/ui/route-badge'
import { cn } from '@/lib/utils/cn'
import { interpolate } from '@/lib/utils/format'

const AWARENESS_LEVELS = ['low', 'medium', 'high'] as const

export function AdminDashboard({ locale, dict }: { locale: Locale; dict: Messages }) {
  const t = dict.d4.admin
  const [grade, setGrade] = React.useState('all')
  const [route, setRoute] = React.useState('all')
  const [awareness, setAwareness] = React.useState('all')
  const [completed, setCompleted] = React.useState('all')
  const [selected, setSelected] = React.useState<AdminStudent | null>(null)

  const rtf = React.useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    [locale],
  )
  const summary = summarize(DEMO_STUDENTS)

  const filtered = DEMO_STUDENTS.filter((s) => {
    if (grade !== 'all' && String(s.grade) !== grade) return false
    if (route !== 'all' && s.route !== route) return false
    if (awareness !== 'all' && s.awarenessLevel !== awareness) return false
    if (completed === 'yes' && !s.assessmentCompleted) return false
    if (completed === 'no' && s.assessmentCompleted) return false
    return true
  })

  const routeTitle = (r: string) => dict.routes[r as keyof typeof dict.routes].title
  const clusterTitle = (c: string) => dict.clusters[c as Cluster].title
  const blockLabel = (b: string) => dict.assessment.blocks[b as Block]
  const careerName = (slug: string) => CAREERS_BY_SLUG[slug]?.name[locale] ?? slug
  const checkInLabel = (s: AdminStudent) =>
    s.lastCheckInDaysAgo == null ? t.noCheckIn : rtf.format(-s.lastCheckInDaysAgo, 'day')

  const cards = [
    { Icon: Users, label: t.cardStudents, value: String(summary.total) },
    { Icon: CheckCircle2, label: t.cardCompleted, value: String(summary.completed) },
    {
      Icon: BarChart3,
      label: t.cardAvgReadiness,
      value: summary.avgReadiness == null ? '—' : `${summary.avgReadiness}`,
    },
    {
      Icon: BarChart3,
      label: t.cardTopRoute,
      value: summary.topRoute ? routeTitle(summary.topRoute) : '—',
    },
    { Icon: AlertTriangle, label: t.cardNeedSupport, value: String(summary.needSupport) },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{dict.admin.title}</h1>
            <p className="mt-1.5 text-muted-foreground">{dict.admin.subtitle}</p>
          </div>
          <Badge variant="secondary">{t.demoBadge}</Badge>
        </div>
        <p className="mt-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {t.demoNote}
        </p>

        {/* Summary cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <c.Icon className="h-5 w-5" />
                </span>
                <p className="mt-2 text-xl font-bold leading-none">{c.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label={t.filterGrade}>
            <option value="all">
              {t.filterGrade}: {t.all}
            </option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <Select value={route} onChange={(e) => setRoute(e.target.value)} aria-label={t.filterRoute}>
            <option value="all">
              {t.filterRoute}: {t.all}
            </option>
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {routeTitle(r)}
              </option>
            ))}
          </Select>
          <Select
            value={awareness}
            onChange={(e) => setAwareness(e.target.value)}
            aria-label={t.filterAwareness}
          >
            <option value="all">
              {t.filterAwareness}: {t.all}
            </option>
            {AWARENESS_LEVELS.map((a) => (
              <option key={a} value={a}>
                {dict.results.awareness[a]}
              </option>
            ))}
          </Select>
          <Select
            value={completed}
            onChange={(e) => setCompleted(e.target.value)}
            aria-label={t.filterCompleted}
          >
            <option value="all">
              {t.filterCompleted}: {t.all}
            </option>
            <option value="yes">{t.completedYes}</option>
            <option value="no">{t.completedNo}</option>
          </Select>
        </div>

        {/* Student list */}
        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">{t.noResults}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border bg-card shadow-soft">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                      {s.name.charAt(0)}
                    </span>
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        {s.name}
                        {needsSupport(s) ? (
                          <Badge variant="outline">{t.needsSupportTag}</Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {interpolate(t.gradeShort, { n: s.grade })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {s.route ? (
                      <RouteBadge route={s.route} label={routeTitle(s.route)} />
                    ) : (
                      <span>{t.notStarted}</span>
                    )}
                    <span>
                      {s.readinessPct == null ? '—' : `${s.readinessPct}/100`}
                    </span>
                    <span>
                      {s.planTotal > 0 ? `${s.planDone}/${s.planTotal}` : '—'}
                    </span>
                    <span>{checkInLabel(s)}</span>
                    <span className="font-medium text-primary">{t.view}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detail drawer */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t.drawerClose}
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setSelected(null)}
          />
          <div className="relative h-full w-full max-w-md overflow-y-auto border-l bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {interpolate(t.gradeShort, { n: selected.grade })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={t.drawerClose}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selected.assessmentCompleted && selected.route ? (
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.drawerResult}
                  </p>
                  <p className="mt-1 font-medium">{routeTitle(selected.route)}</p>
                  <p className="text-muted-foreground">
                    {selected.readinessPct}/100 ·{' '}
                    {selected.awarenessLevel
                      ? dict.results.awareness[selected.awarenessLevel]
                      : ''}{' '}
                    · {selected.primaryCluster ? clusterTitle(selected.primaryCluster) : ''}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t.drawerStrengths}</p>
                    <p className="mt-0.5">{selected.strengths.map(blockLabel).join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t.drawerGrowth}</p>
                    <p className="mt-0.5">{selected.growthAreas.map(blockLabel).join(', ') || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t.drawerRecommendations}
                  </p>
                  <p className="mt-1">{selected.recommendedCareers.map(careerName).join(', ') || '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t.drawerPlan}</p>
                    <p className="mt-0.5">
                      {selected.planTotal > 0 ? `${selected.planDone}/${selected.planTotal}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{t.drawerCheckIns}</p>
                    <p className="mt-0.5">
                      {selected.checkInCount} · {checkInLabel(selected)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t.notStarted}</p>
            )}

            <Button className="mt-6 w-full" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {t.viewReport}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Printable report (only visible when printing) */}
      {selected ? (
        <div className="hidden print:block">
          <h1 className="text-2xl font-bold">{t.reportTitle}</h1>
          <p className="mt-1 text-sm">
            {selected.name} · {interpolate(t.gradeShort, { n: selected.grade })}
          </p>
          {selected.assessmentCompleted && selected.route ? (
            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>{t.drawerResult}:</strong> {routeTitle(selected.route)} ·{' '}
                {selected.readinessPct}/100
              </p>
              <p>
                <strong>{t.drawerStrengths}:</strong> {selected.strengths.map(blockLabel).join(', ')}
              </p>
              <p>
                <strong>{t.drawerGrowth}:</strong> {selected.growthAreas.map(blockLabel).join(', ')}
              </p>
              <p>
                <strong>{t.drawerRecommendations}:</strong>{' '}
                {selected.recommendedCareers.map(careerName).join(', ')}
              </p>
              <p>
                <strong>{t.drawerPlan}:</strong> {selected.planDone}/{selected.planTotal}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm">{t.notStarted}</p>
          )}
          <p className="mt-6 text-xs">{t.reportDisclaimer}</p>
        </div>
      ) : null}
    </div>
  )
}
