'use client'

/**
 * LIVE (Firebase) admin dashboard.
 *
 * Fetches the privacy-safe roster from /api/admin/students WITH the signed-in
 * admin's Firebase ID token (Authorization: Bearer). Authorization is enforced
 * server-side by the `admin: true` custom claim — this UI only reflects the
 * result (403 → "access required", 503 → "unavailable").
 *
 * Shows aggregate counts, a searchable/filterable table, CSV export, per-student
 * PDF export, and an audited "delete history" action behind a typed confirm.
 *
 * INVARIANT: NO chat history is shown or fetched anywhere here.
 */
import * as React from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Trash2,
  Users,
} from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { ROUTES, type Route } from '@/lib/methodology/routes'
import { getIdToken } from '@/lib/firebase/auth-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { RouteBadge } from '@/components/ui/route-badge'
import { interpolate } from '@/lib/utils/format'

interface StudentRow {
  uid: string
  name: string
  grade: number | null
  archived: boolean
  assessmentCompleted: boolean
  route: string | null
  routeKey: string | null
  secondaryRoute: string | null
  score: number | null
  clarity: string | null
  planDone: number
  planTotal: number
  planPct: number | null
  lastCheckIn: string | null
  recommendedCareers: string[]
}

type LoadState = 'loading' | 'ready' | 'forbidden' | 'unavailable' | 'error'

async function authedFetch(
  url: string,
  init?: RequestInit,
  forceRefresh = false,
): Promise<Response> {
  // forceRefresh re-fetches the ID token from Firebase (bypassing the ~1h cache)
  // so a just-granted `admin` claim is picked up without a manual sign-out/in.
  const token = await getIdToken(forceRefresh)
  if (!token) throw new Error('no_token')
  return fetch(url, {
    ...init,
    headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
  })
}

export function LiveAdminDashboard({ locale, dict }: { locale: Locale; dict: Messages }) {
  const t = dict.d4.admin
  const [state, setState] = React.useState<LoadState>('loading')
  const [rows, setRows] = React.useState<StudentRow[]>([])
  const [query, setQuery] = React.useState('')
  const [routeFilter, setRouteFilter] = React.useState('all')
  const [pdfBusy, setPdfBusy] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<StudentRow | null>(null)

  const routeTitle = (r: string) => dict.routes[r as keyof typeof dict.routes].title

  const load = React.useCallback(async () => {
    setState('loading')
    setActionError(null)
    try {
      // Force a token refresh on load so a newly-granted admin claim applies
      // immediately (no manual sign-out/in needed).
      const res = await authedFetch(`/api/admin/students?lang=${locale}`, undefined, true)
      if (res.status === 403) {
        setState('forbidden')
        return
      }
      if (res.status === 503) {
        setState('unavailable')
        return
      }
      if (!res.ok) {
        setState('error')
        return
      }
      const json = (await res.json()) as { data?: { students?: StudentRow[] } }
      setRows(json.data?.students ?? [])
      setState('ready')
    } catch (err) {
      // No Firebase token (not signed in) → treat as access required.
      setState((err as Error).message === 'no_token' ? 'forbidden' : 'error')
    }
  }, [locale])

  React.useEffect(() => {
    void load()
  }, [load])

  const filtered = rows.filter((r) => {
    if (routeFilter !== 'all' && r.routeKey !== routeFilter) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      if (!r.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  const completed = rows.filter((r) => r.assessmentCompleted)
  const needSupport = rows.filter(
    (r) => !r.archived && (!r.assessmentCompleted || (r.planTotal > 0 && r.planDone === 0)),
  ).length
  const cards = [
    { Icon: Users, label: t.cardStudents, value: String(rows.length) },
    { Icon: CheckCircle2, label: t.cardCompleted, value: String(completed.length) },
    { Icon: AlertTriangle, label: t.cardNeedSupport, value: String(needSupport) },
  ]

  function exportCsv() {
    // CSV is a same-tab navigation with the token in a header — so fetch the blob.
    void (async () => {
      setActionError(null)
      try {
        const res = await authedFetch(`/api/admin/students/export?lang=${locale}`)
        if (!res.ok) {
          setActionError(t.loadError)
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch {
        setActionError(t.loadError)
      }
    })()
  }

  function exportPdf(row: StudentRow) {
    void (async () => {
      setPdfBusy(row.uid)
      setActionError(null)
      try {
        const res = await authedFetch(`/api/admin/students/${row.uid}/report?lang=${locale}`)
        if (!res.ok) {
          setActionError(t.pdfError)
          return
        }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `student-${row.uid}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch {
        setActionError(t.pdfError)
      } finally {
        setPdfBusy(null)
      }
    })()
  }

  // --- Non-ready states ----------------------------------------------------
  if (state === 'loading') {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        {t.loading}
      </div>
    )
  }

  if (state === 'forbidden' || state === 'unavailable') {
    const title = state === 'forbidden' ? t.accessRequiredTitle : t.unavailableTitle
    const body = state === 'forbidden' ? t.accessRequiredBody : t.unavailableBody
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{body}</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-xl font-bold">{t.loadError}</h1>
        <Button className="mt-4" onClick={() => void load()}>
          {t.retry}
        </Button>
      </div>
    )
  }

  // --- Ready ---------------------------------------------------------------
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.liveTitle}</h1>
          <p className="mt-1.5 text-muted-foreground">{t.liveSubtitle}</p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          {t.exportCsv}
        </Button>
      </div>

      {/* Aggregate metrics */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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

      {/* Search + filter */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.search}
        />
        <Select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          aria-label={t.filterRoute}
        >
          <option value="all">
            {t.filterRoute}: {t.all}
          </option>
          {ROUTES.map((r: Route) => (
            <option key={r} value={r}>
              {routeTitle(r)}
            </option>
          ))}
        </Select>
      </div>

      {actionError ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">{t.noResults}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border bg-card shadow-soft">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">{t.colName}</th>
                <th className="px-4 py-3 font-semibold">{t.colGrade}</th>
                <th className="px-4 py-3 font-semibold">{t.colRoute}</th>
                <th className="px-4 py-3 font-semibold">{t.colScore}</th>
                <th className="px-4 py-3 font-semibold">{t.colClarity}</th>
                <th className="px-4 py-3 font-semibold">{t.colPlan}</th>
                <th className="px-4 py-3 font-semibold">{t.colCheckIn}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.uid} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-medium">
                      {r.name}
                      {r.archived ? <Badge variant="outline">{t.archivedTag}</Badge> : null}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.grade ?? '—'}</td>
                  <td className="px-4 py-3">
                    {r.routeKey ? (
                      <RouteBadge route={r.routeKey as Route} label={routeTitle(r.routeKey)} />
                    ) : (
                      <span className="text-muted-foreground">{t.notStarted}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.score == null ? '—' : `${r.score}/100`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.clarity ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.planTotal > 0 ? `${r.planDone}/${r.planTotal}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.lastCheckIn ?? t.noCheckIn}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportPdf(r)}
                        disabled={pdfBusy === r.uid || !r.assessmentCompleted}
                        aria-busy={pdfBusy === r.uid}
                      >
                        {pdfBusy === r.uid ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        {pdfBusy === r.uid ? t.exportingPdf : t.exportPdf}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActionError(null)
                          setDeleteTarget(r)
                        }}
                        aria-label={`${t.deleteHistory}: ${r.name}`}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget ? (
        <DeleteHistoryDialog
          dict={dict}
          row={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDone={() => {
            setDeleteTarget(null)
            void load()
          }}
        />
      ) : null}
    </div>
  )
}

function DeleteHistoryDialog({
  dict,
  row,
  onClose,
  onDone,
}: {
  dict: Messages
  row: StudentRow
  onClose: () => void
  onDone: () => void
}) {
  const t = dict.d4.admin
  const [typed, setTyped] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const confirmWord = t.deleteConfirmWord
  const armed = typed.trim().toUpperCase() === confirmWord.toUpperCase()

  async function confirm() {
    if (!armed || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await authedFetch(`/api/admin/students/${row.uid}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      if (!res.ok) {
        setError(t.deleteError)
        return
      }
      onDone()
    } catch {
      setError(t.deleteError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.deleteDialogTitle}
    >
      <button type="button" aria-label={t.deleteCancel} className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-bold">{t.deleteDialogTitle}</h2>
        <p className="mt-1 text-sm font-medium">{row.name}</p>
        <p className="mt-3 text-sm text-muted-foreground">{t.deleteDialogBody}</p>
        <label className="mt-4 block text-sm font-medium">
          {interpolate(t.deleteConfirmPrompt, { word: confirmWord })}
        </label>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-1.5"
          autoFocus
          aria-label={interpolate(t.deleteConfirmPrompt, { word: confirmWord })}
        />
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {t.deleteCancel}
          </Button>
          <Button
            onClick={() => void confirm()}
            disabled={!armed || busy}
            aria-busy={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {busy ? t.deleteWorking : t.deleteConfirmButton}
          </Button>
        </div>
      </div>
    </div>
  )
}
