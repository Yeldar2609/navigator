import type { StudentSnapshot } from './snapshot'

/**
 * Builds the MINIMAL student context sent to the AI counselor. Deliberately
 * excludes school code, admin data, raw answers, email, name, and any identifier
 * beyond what the counselor needs to be relevant. See docs/SECURITY_AND_PRIVACY.md.
 */
export interface CounselorContext {
  language: string
  grade: number | null
  ageRange: string | null
  latestRoute: string | null
  topClusters: string[]
  qualities: string[]
  growthAreas: string[]
  recommendedCareers: string[]
  activePlanSummary: string | null
  recentCheckInSummary: string | null
}

/** Coarse age bucket — we never send an exact age to the model. */
export function ageToRange(age: number | null | undefined): string | null {
  if (age == null) return null
  if (age <= 13) return '≤13'
  if (age <= 15) return '14–15'
  if (age <= 17) return '16–17'
  return '18+'
}

export function buildCounselorContext(
  snapshot: StudentSnapshot,
  opts?: { age?: number | null },
): CounselorContext {
  const topClusters = [snapshot.primaryCluster, snapshot.secondaryCluster].filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  )

  const plan = snapshot.activePlan
  const activePlanSummary = plan
    ? `${plan.doneCount}/${plan.totalCount} done over ${plan.horizonMonths} months` +
      (plan.nextActionTitle ? `; next: ${plan.nextActionTitle}` : '')
    : null

  const ci = snapshot.recentCheckIns
  const recentCheckInSummary = ci
    ? `${ci.count} recent check-ins; avg mood ${ci.avgMood ?? '—'}, avg confidence ${ci.avgConfidence ?? '—'}`
    : null

  return {
    language: snapshot.locale,
    grade: snapshot.gradeLevel,
    ageRange: ageToRange(opts?.age),
    latestRoute: snapshot.primaryRoute,
    topClusters,
    qualities: snapshot.strengths,
    growthAreas: snapshot.growthAreas,
    recommendedCareers: snapshot.recommendedCareers.slice(0, 3),
    activePlanSummary,
    recentCheckInSummary,
  }
}

/** Flatten the context into Dialogflow CX session parameters (string-safe). */
export function toDialogflowParameters(ctx: CounselorContext): Record<string, unknown> {
  return {
    language: ctx.language,
    grade: ctx.grade,
    age_range: ctx.ageRange,
    latest_route: ctx.latestRoute,
    top_clusters: ctx.topClusters,
    qualities: ctx.qualities,
    growth_areas: ctx.growthAreas,
    recommended_careers: ctx.recommendedCareers,
    active_plan: ctx.activePlanSummary,
    recent_checkins: ctx.recentCheckInSummary,
  }
}
