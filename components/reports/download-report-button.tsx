'use client'

/**
 * Download PDF button for the results view.
 *
 * Assembles a DERIVED report payload (scores, route, clusters, qualities,
 * strengths/growth, recommendations, plan summary) from the local result +
 * profile + the methodology catalog — never chats or raw answers — then POSTs it
 * to /api/report with a fresh Firebase ID token. On success it opens the signed
 * URL; if Admin storage isn't configured the route returns 503 and we show a
 * neutral "being set up" message.
 */
import * as React from 'react'
import { Download } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import { getIdToken } from '@/lib/firebase/auth-client'
import { getLatestResult } from '@/lib/data/assessment'
import { getProfile } from '@/lib/data/profile'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { relatedMajorsFor } from '@/lib/methodology/majors-data'
import { UNIVERSITIES } from '@/lib/methodology/universities-data'
import { SUBJECT_LABELS, SKILL_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import { Button } from '@/components/ui/button'
import { interpolate } from '@/lib/utils/format'
import type { ReportData } from '@/lib/reports/pdf-document'

type Status = 'idle' | 'loading' | 'error' | 'unavailable'

function uniq(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

/** Build the localized, derived report payload from local state + catalog. */
function buildReportData(locale: Locale, dict: Messages): ReportData | null {
  const result = getLatestResult()
  if (!result) return null
  const profile = getProfile()
  const score = result.score
  const r = dict.reports

  const studentName = profile?.displayName?.trim() || dict.reports.defaultStudentName

  const gradeLabel =
    typeof profile?.gradeLevel === 'number'
      ? interpolate(dict.d4.admin.gradeShort, { n: profile.gradeLevel })
      : undefined

  const date = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const clusters = uniq(
    [score.primaryCluster, score.secondaryCluster].map((c) => dict.clusters[c].title),
  )

  // Qualities: cluster descriptions read as standout qualities.
  const qualities = uniq(
    [score.primaryCluster, score.secondaryCluster].map((c) => dict.clusters[c].description),
  )

  // Motivation / work-style: a short, encouraging sentence from the profile.
  const motivationProfile = interpolate(r.motivationTemplate, {
    cluster: dict.clusters[score.primaryCluster].title,
    route: dict.routes[score.primaryRoute].title,
  })

  const strengths = uniq(score.strengths.map((b) => dict.assessment.blocks[b]))
  const growthAreas = uniq(score.growthAreas.map((b) => dict.assessment.blocks[b]))

  // Recommendations → careers / majors / subjects / projects / universities.
  const recCareers = result.recommendations
    .filter((rec) => rec.bucket === 'recommended' || rec.bucket === 'exploratory')
    .slice(0, 6)

  const careers = uniq(
    recCareers.map((rec) => CAREERS_BY_SLUG[rec.slug]?.name[locale] ?? rec.slug),
  )

  const majors = uniq(
    recCareers
      .map((rec) => CAREERS_BY_SLUG[rec.slug])
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .flatMap((c) => relatedMajorsFor(c, 3))
      .map((m) => m.name[locale]),
  ).slice(0, 6)

  const subjects = uniq([
    ...recCareers.flatMap((rec) => rec.matchedSubjects),
    ...recCareers.flatMap((rec) => CAREERS_BY_SLUG[rec.slug]?.subjectTags ?? []),
  ]).slice(0, 6).map((s) => labelFor(SUBJECT_LABELS, s, locale))

  // Project ideas: turn the top skill gaps into "practice {skill}" prompts.
  const skillGaps = uniq(recCareers.flatMap((rec) => rec.skillGaps)).slice(0, 5)
  const projects = skillGaps.map((s) =>
    interpolate(r.projectTemplate, { skill: labelFor(SKILL_LABELS, s, locale) }),
  )

  // Universities associated with the student's primary route.
  const universities = uniq(
    UNIVERSITIES.filter((u) => u.routes.includes(score.primaryRoute))
      .slice(0, 4)
      .map((u) => `${u.name[locale]} — ${u.city[locale]}`),
  )

  const planSummary = interpolate(r.planSummaryTemplate, {
    route: dict.routes[score.primaryRoute].title,
  })

  const methodologyVersion = interpolate(r.methodologyTemplate, {
    methodology: score.methodologyVersion,
    scoring: score.scoringVersion,
    template: score.templateVersion,
  })

  return {
    appName: r.appName,
    studentName,
    gradeLabel,
    date,
    route: dict.routes[score.primaryRoute].title,
    routeDescription: dict.routes[score.primaryRoute].description,
    clusters,
    qualities,
    motivationProfile,
    score0to100: score.ipoPct100,
    score0to60: score.ipoRaw60,
    awarenessLabel: dict.results.awareness[score.awarenessLevel],
    strengths,
    growthAreas,
    careers,
    majors,
    subjects,
    projects,
    universities,
    planSummary,
    methodologyVersion,
    dataSourceNote: r.dataSourceNote,
    disclaimer: r.disclaimer,
    labels: {
      reportTitle: r.reportTitle,
      preparedFor: r.preparedFor,
      generatedOn: r.generatedOn,
      readinessScore: r.readinessScore,
      internalScoreDetail: r.internalScoreDetail,
      yourDirection: r.yourDirection,
      yourClusters: r.yourClusters,
      yourQualities: r.yourQualities,
      motivationWorkStyle: r.motivationWorkStyle,
      yourStrengths: r.yourStrengths,
      areasToGrow: r.areasToGrow,
      recommendedCareers: r.recommendedCareers,
      recommendedMajors: r.recommendedMajors,
      subjectsToFocus: r.subjectsToFocus,
      projectIdeas: r.projectIdeas,
      universitiesToExplore: r.universitiesToExplore,
      yourPlan: r.yourPlan,
      methodology: r.methodology,
      dataSources: r.dataSources,
      disclaimerHeading: r.disclaimerHeading,
      none: r.none,
    },
  }
}

export function DownloadReportButton({
  locale,
  dict,
  className,
}: {
  locale: Locale
  dict: Messages
  className?: string
}) {
  const r = dict.reports
  const [status, setStatus] = React.useState<Status>('idle')

  async function handleDownload() {
    setStatus('loading')
    try {
      const data = buildReportData(locale, dict)
      if (!data) {
        setStatus('error')
        return
      }
      const token = await getIdToken()
      if (!token) {
        // No signed-in Firebase user (e.g. demo/preview) — treat as unavailable.
        setStatus('unavailable')
        return
      }

      const res = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (res.status === 503) {
        setStatus('unavailable')
        return
      }
      if (!res.ok) {
        setStatus('error')
        return
      }

      const json = (await res.json()) as { ok?: boolean; data?: { url?: string } }
      const url = json?.data?.url
      if (!url) {
        setStatus('error')
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="lg"
        onClick={handleDownload}
        disabled={status === 'loading'}
        aria-busy={status === 'loading'}
      >
        {status !== 'loading' && <Download className="h-4 w-4" />}
        {status === 'loading' ? r.generating : r.downloadPdf}
      </Button>
      {status === 'error' && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {r.error}
        </p>
      )}
      {status === 'unavailable' && (
        <p className="mt-2 text-sm text-muted-foreground" role="status">
          {r.unavailable}
        </p>
      )}
    </div>
  )
}
