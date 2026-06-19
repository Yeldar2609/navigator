// Central, versioned scoring configuration. Bump SCORING_VERSION when any rule
// here changes so stored results remain reproducible (assessment_results stores
// scoring_version).

export const TEMPLATE_VERSION = 'v1'
// Bumped for Day 2: IPO v1 (6-criteria) + route tie-breaks + recommendations.
export const SCORING_VERSION = 'scoring_v2'
// Identifies the whole methodology (item set + clusters + routes + IPO + recs).
export const METHODOLOGY_VERSION = 'navigator_methodology_v1'

export const LIKERT_MIN = 1
export const LIKERT_MAX = 5
export const TOTAL_ITEMS = 40

// --- Professional Awareness Index (IPO) ----------------------------------
// Canonical scale is raw 0–60 (thesis), plus a normalized 0–100 percentage.
// 40 Likert items sum to 40–200, so a transform is REQUIRED to reach 0–60.
//
// Default method `rescale_all` linearly maps the full-instrument total onto
// 0–60. This is a SAFE, CONFIGURABLE default; the exact thesis awareness
// sub-scale is unknown and tracked as a TODO. To switch to a specific subset
// later, set method to 'item_subset' and fill subsetItemCodes — no other code
// changes needed (see scoring.ts). Documented in docs/METHODOLOGY_ASSUMPTIONS.md.
export type AwarenessMethod = 'rescale_all' | 'item_subset'

export interface AwarenessConfig {
  method: AwarenessMethod
  rawMax: number
  /** Used only when method === 'item_subset'. TODO_METHODOLOGY: confirm from thesis. */
  subsetItemCodes: string[]
}

export const AWARENESS_CONFIG: AwarenessConfig = {
  method: 'rescale_all',
  rawMax: 60,
  subsetItemCodes: [],
}

// Awareness levels on the canonical 0–60 raw scale:
//   low: raw < 30 | medium: 30–47 | high: 48–60
export const AWARENESS_THRESHOLDS = {
  lowMaxExclusive: 30, // raw < 30 => low
  mediumMaxInclusive: 47, // 30..47 => medium, else high
} as const

// --- Cluster scoring ------------------------------------------------------
// Counts per cluster are uneven (8–10) and items overlap, so we normalize each
// cluster to 0–100 (mean of its item answers mapped onto the Likert range).
export type ClusterScoreMethod = 'normalized_percent'
export const CLUSTER_SCORE_METHOD: ClusterScoreMethod = 'normalized_percent'

// --- Awareness method selection (Day 2: IPO v1) ---------------------------
// IPO v1 composes 6 criteria (each 0–10) into the canonical 0–60 raw score,
// using assessment block/cluster scores AND onboarding inputs. This is a
// PRODUCTIZATION assumption (documented in docs/METHODOLOGY_ASSUMPTIONS.md).
// 'rescale_all' (Day 1) stays as a fallback for callers with no onboarding ctx.
export type AwarenessMethodV2 = 'ipo_v1' | 'rescale_all'
export const AWARENESS_METHOD: AwarenessMethodV2 = 'ipo_v1'

export type SupportPreference = 'simple_guidance' | 'detailed_guidance' | 'ai_counselor'

export interface OnboardingContext {
  careerConfidence?: number // 1..5
  supportPreference?: SupportPreference
  favoriteSubjects?: string[]
  currentGoals?: string[]
}

export const IPO_V1 = {
  interestDistinctnessGap: 30, // cluster-gap (pts) that counts as fully distinct
  defaultCareerConfidence: 3, // demo default when onboarding unknown
  independenceBySupport: {
    simple_guidance: 0.8,
    detailed_guidance: 0.6,
    ai_counselor: 0.5,
  } as Record<SupportPreference, number>,
  independenceDefault: 0.6,
  planBefore: 4,
  planAfter: 8,
} as const

// Points within which the top-2 clusters are "close" (route tie-break logic).
export const ROUTE_TIE_THRESHOLD = 10

// --- Career recommendation weights (Day 3 v2) -----------------------------
// Max achievable ~90 (route + primary-cluster + subjects + goals + market +
// grade). primary/secondary cluster are mutually exclusive. Grade feasibility
// is a flat presence bonus in v2 (all seeded careers suit grades 8–11);
// TODO: per-career grade gating. See docs/METHODOLOGY_ASSUMPTIONS.md.
export const RECOMMENDATION_WEIGHTS = {
  routeMatch: 35,
  clusterPrimary: 20,
  clusterSecondary: 10,
  subjectOverlapPerHit: 5,
  subjectOverlapMax: 10,
  goalOverlapPerHit: 5,
  goalOverlapMax: 10,
  marketMax: 10,
  gradeFeasibility: 5,
} as const

// Confidence thresholds on the recommendation score (~0–90 scale).
export const RECOMMENDATION_CONFIDENCE = { highMin: 65, mediumMin: 45 } as const

export const RECOMMENDATION_TOP_RECOMMENDED = 3
export const RECOMMENDATION_TOP_EXPLORATORY = 3
export const RECOMMENDATION_TOP_STRETCH = 1
