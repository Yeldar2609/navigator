/**
 * SERVER-ONLY admin data derivation. Reads a student's Firestore documents via
 * the Admin SDK and projects them down to the small, PRIVACY-SAFE shapes the
 * admin UI / exports / PDF need.
 *
 * INVARIANTS (privacy-critical):
 *  - NEVER read or return `chatThreads` / `chatMessages`.
 *  - NEVER return raw 1–5 assessment answers (`assessmentAnswers`).
 *  - Only DERIVED fields leave this module: name, grade, route(s), score,
 *    clarity, plan progress, last check-in, recommended-career names.
 *
 * Callers must already have passed `requireAdmin()` — these helpers do no auth.
 */
import type { Firestore } from 'firebase-admin/firestore'
import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/dictionaries'
import type { StoredProfile, StoredResult, StoredPlan, StoredCheckIn } from '@/lib/data/types'
import { CAREERS_BY_SLUG } from '@/lib/methodology/careers-data'
import { relatedMajorsFor } from '@/lib/methodology/majors-data'
import { UNIVERSITIES } from '@/lib/methodology/universities-data'
import { routeForCluster } from '@/lib/methodology/recommendation-rules'
import { SUBJECT_LABELS, SKILL_LABELS, labelFor } from '@/lib/methodology/tag-labels'
import { interpolate } from '@/lib/utils/format'
import type { ReportData } from '@/lib/reports/pdf-document'

/** A single privacy-safe row for the admin list / CSV export. */
export interface AdminStudentRow {
  uid: string
  name: string
  grade: number | null
  archived: boolean
  assessmentCompleted: boolean
  route: string | null
  routeKey: string | null
  secondaryRoute: string | null
  score: number | null // 0..100
  clarity: string | null // localized awareness label
  planDone: number
  planTotal: number
  planPct: number | null
  lastCheckIn: string | null // localized date or null
  recommendedCareers: string[] // top 2–3 names
}

function uniq(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

/** Best-effort localized date from an ISO string or Firestore Timestamp-ish. */
function formatDate(value: unknown, locale: Locale): string | null {
  if (!value) return null
  let ms: number | null = null
  if (typeof value === 'string') {
    const t = Date.parse(value)
    ms = Number.isNaN(t) ? null : t
  } else if (typeof value === 'object' && value !== null) {
    const v = value as { toDate?: () => Date; _seconds?: number; seconds?: number }
    if (typeof v.toDate === 'function') ms = v.toDate().getTime()
    else if (typeof v._seconds === 'number') ms = v._seconds * 1000
    else if (typeof v.seconds === 'number') ms = v.seconds * 1000
  }
  if (ms == null) return null
  return new Date(ms).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface StudentDocs {
  profile: StoredProfile | null
  result: StoredResult | null
  plan: StoredPlan | null
  lastCheckIn: StoredCheckIn | null
  archived: boolean
}

/**
 * Read ONLY the privacy-safe subcollections for one uid. Never touches chat or
 * raw answers. Reads the single latest doc of each subcollection.
 */
async function readStudentDocs(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>,
): Promise<StudentDocs> {
  const userRef = db.collection('users').doc(uid)

  const [resultSnap, planSnap, checkInSnap] = await Promise.all([
    userRef.collection('assessmentResults').orderBy('createdAt', 'desc').limit(1).get(),
    userRef.collection('plans').orderBy('createdAt', 'desc').limit(1).get(),
    userRef.collection('checkIns').orderBy('createdAt', 'desc').limit(1).get(),
  ])

  return {
    profile: userData as unknown as StoredProfile,
    result: resultSnap.empty ? null : (resultSnap.docs[0].data() as StoredResult),
    plan: planSnap.empty ? null : (planSnap.docs[0].data() as StoredPlan),
    lastCheckIn: checkInSnap.empty ? null : (checkInSnap.docs[0].data() as StoredCheckIn),
    archived: userData.archived === true,
  }
}

function planProgress(plan: StoredPlan | null): { done: number; total: number; pct: number | null } {
  if (!plan || !Array.isArray(plan.items) || plan.items.length === 0) {
    return { done: 0, total: 0, pct: null }
  }
  const total = plan.items.length
  const done = plan.items.filter((i) => i.status === 'done').length
  return { done, total, pct: Math.round((done / total) * 100) }
}

function gradeNumber(profile: StoredProfile | null): number | null {
  if (!profile) return null
  return typeof profile.gradeLevel === 'number' ? profile.gradeLevel : null
}

function studentName(profile: StoredProfile | null, dict: Messages): string {
  const name = profile?.displayName?.trim()
  return name || dict.reports.defaultStudentName
}

/** Top N recommended/exploratory career names from a stored result. */
function topCareerNames(result: StoredResult | null, locale: Locale, n: number): string[] {
  if (!result?.recommendations) return []
  return uniq(
    result.recommendations
      .filter((rec) => rec.bucket === 'recommended' || rec.bucket === 'exploratory')
      .slice(0, n)
      .map((rec) => CAREERS_BY_SLUG[rec.slug]?.name[locale] ?? rec.slug),
  )
}

/** Build one privacy-safe list/CSV row from a uid + its raw user document. */
export async function deriveStudentRow(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>,
  locale: Locale,
  dict: Messages,
): Promise<AdminStudentRow> {
  const docs = await readStudentDocs(db, uid, userData)
  const score = docs.result?.score ?? null
  const plan = planProgress(docs.plan)

  const routeKey = score?.primaryRoute ?? null
  const secondaryRouteKey = score ? routeForCluster(score.secondaryCluster) : null

  return {
    uid,
    name: studentName(docs.profile, dict),
    grade: gradeNumber(docs.profile),
    archived: docs.archived,
    assessmentCompleted: Boolean(score),
    route: routeKey ? dict.routes[routeKey].title : null,
    routeKey,
    secondaryRoute:
      secondaryRouteKey && secondaryRouteKey !== routeKey
        ? dict.routes[secondaryRouteKey].title
        : null,
    score: score?.ipoPct100 ?? null,
    clarity: score ? dict.results.awareness[score.awarenessLevel] : null,
    planDone: plan.done,
    planTotal: plan.total,
    planPct: plan.pct,
    lastCheckIn: formatDate(docs.lastCheckIn?.createdAt, locale),
    recommendedCareers: topCareerNames(docs.result, locale, 3),
  }
}

/** List every user, deriving a privacy-safe row each. Excludes nothing by default. */
export async function listStudentRows(
  db: Firestore,
  locale: Locale,
  dict: Messages,
): Promise<AdminStudentRow[]> {
  const snap = await db.collection('users').get()
  const rows = await Promise.all(
    snap.docs.map((d) => deriveStudentRow(db, d.id, d.data() as Record<string, unknown>, locale, dict)),
  )
  // Stable sort: name asc.
  rows.sort((a, b) => a.name.localeCompare(b.name))
  return rows
}

/**
 * Build the FULL derived ReportData for one target student — the same shape the
 * student's own report uses (lib/reports/pdf-document.tsx). Reuses the catalog
 * and templates; contains no chats / raw answers. Returns null if the student
 * has no assessment result yet.
 */
export async function buildAdminReportData(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>,
  locale: Locale,
  dict: Messages,
): Promise<ReportData | null> {
  const docs = await readStudentDocs(db, uid, userData)
  const result = docs.result
  if (!result) return null
  const score = result.score
  const r = dict.reports

  const name = studentName(docs.profile, dict)
  const grade = gradeNumber(docs.profile)
  const gradeLabel = grade != null ? interpolate(dict.d4.admin.gradeShort, { n: grade }) : undefined

  const date = new Date().toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const clusters = uniq(
    [score.primaryCluster, score.secondaryCluster].map((c) => dict.clusters[c].title),
  )
  const qualities = uniq(
    [score.primaryCluster, score.secondaryCluster].map((c) => dict.clusters[c].description),
  )

  const motivationProfile = interpolate(r.motivationTemplate, {
    cluster: dict.clusters[score.primaryCluster].title,
    route: dict.routes[score.primaryRoute].title,
  })

  const strengths = uniq(score.strengths.map((b) => dict.assessment.blocks[b]))
  const growthAreas = uniq(score.growthAreas.map((b) => dict.assessment.blocks[b]))

  const recCareers = result.recommendations
    .filter((rec) => rec.bucket === 'recommended' || rec.bucket === 'exploratory')
    .slice(0, 6)

  const careers = uniq(recCareers.map((rec) => CAREERS_BY_SLUG[rec.slug]?.name[locale] ?? rec.slug))

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
  ])
    .slice(0, 6)
    .map((s) => labelFor(SUBJECT_LABELS, s, locale))

  const skillGaps = uniq(recCareers.flatMap((rec) => rec.skillGaps)).slice(0, 5)
  const projects = skillGaps.map((s) =>
    interpolate(r.projectTemplate, { skill: labelFor(SKILL_LABELS, s, locale) }),
  )

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
    studentName: name,
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
