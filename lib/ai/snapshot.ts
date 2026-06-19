import type { Locale } from '@/lib/i18n/config'
import type { Cluster } from '@/lib/methodology/clusters'
import type { Route } from '@/lib/methodology/routes'
import type { AwarenessLevel } from '@/lib/methodology/awareness-index'

// The MINIMAL student picture sent to the AI. Deliberately excludes PII (no
// name, email, school, exact age) — only what the counselor needs to be
// relevant. See docs/PRIVACY_AND_SAFETY.md.
export interface StudentSnapshot {
  hasResult: boolean
  gradeLevel: number | null
  locale: Locale
  awarenessLevel: AwarenessLevel | null
  scorePct: number | null
  primaryRoute: Route | null
  primaryCluster: Cluster | null
  secondaryCluster: Cluster | null
  strengths: string[] // block keys
  growthAreas: string[] // block keys
  recommendedCareers: string[] // career slugs (top 3)
  skillGaps: string[] // skill tag keys to build next
  activePlan: {
    horizonMonths: number
    doneCount: number
    totalCount: number
    nextActionTitle: string | null
  } | null
  recentCheckIns: {
    count: number
    avgMood: number | null
    avgConfidence: number | null
  } | null
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10
}

/** Build the minimal snapshot from already-fetched pieces (client or server). */
export function buildSnapshot(input: {
  locale: Locale
  gradeLevel: number | null
  score: {
    awarenessLevel: AwarenessLevel
    ipoPct100: number
    primaryRoute: Route
    primaryCluster: Cluster
    secondaryCluster: Cluster
    strengths: string[]
    growthAreas: string[]
  } | null
  recommendedCareers?: string[]
  skillGaps?: string[]
  plan?: {
    horizonMonths: number
    doneCount: number
    totalCount: number
    nextActionTitle: string | null
  } | null
  checkIns?: { mood: number; confidence: number }[]
}): StudentSnapshot {
  const { locale, gradeLevel, score } = input
  const checkIns = input.checkIns ?? []
  return {
    hasResult: !!score,
    gradeLevel,
    locale,
    awarenessLevel: score?.awarenessLevel ?? null,
    scorePct: score?.ipoPct100 ?? null,
    primaryRoute: score?.primaryRoute ?? null,
    primaryCluster: score?.primaryCluster ?? null,
    secondaryCluster: score?.secondaryCluster ?? null,
    strengths: score?.strengths ?? [],
    growthAreas: score?.growthAreas ?? [],
    recommendedCareers: input.recommendedCareers ?? [],
    skillGaps: input.skillGaps ?? [],
    activePlan: input.plan ?? null,
    recentCheckIns: checkIns.length
      ? {
          count: checkIns.length,
          avgMood: avg(checkIns.map((c) => c.mood)),
          avgConfidence: avg(checkIns.map((c) => c.confidence)),
        }
      : null,
  }
}
