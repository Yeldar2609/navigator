import { CAREERS, CAREERS_BY_SLUG, type Career } from './careers-data'
import type { Cluster } from './clusters'
import type { Route } from './routes'
import {
  RECOMMENDATION_CONFIDENCE,
  RECOMMENDATION_TOP_EXPLORATORY,
  RECOMMENDATION_TOP_RECOMMENDED,
  RECOMMENDATION_TOP_STRETCH,
  RECOMMENDATION_WEIGHTS,
} from './scoring-config'

export type RecommendationBucket = 'recommended' | 'exploratory' | 'stretch'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

export interface CareerRecommendation {
  slug: string
  score: number
  bucket: RecommendationBucket
  confidenceLevel: ConfidenceLevel
  matchedRoute: boolean
  matchedClusters: Cluster[]
  matchedSubjects: string[]
  matchedGoals: string[]
  skillGaps: string[] // drives possible_skill_gap + what_to_learn_next in the UI
  route: Route
}

export interface RecommendInput {
  primaryRoute: Route
  primaryCluster: Cluster
  secondaryCluster: Cluster
  favoriteSubjects?: string[]
  currentGoals?: string[]
  gradeLevel?: number | null
  careers?: Career[]
}

function overlap(a: string[] = [], b: string[] = []): string[] {
  const set = new Set(b)
  return a.filter((x) => set.has(x))
}

function confidence(score: number): ConfidenceLevel {
  if (score >= RECOMMENDATION_CONFIDENCE.highMin) return 'high'
  if (score >= RECOMMENDATION_CONFIDENCE.mediumMin) return 'medium'
  return 'low'
}

interface Scored extends Omit<CareerRecommendation, 'bucket' | 'confidenceLevel'> {
  clusterMatched: boolean
  interestMatched: boolean
}

/** Score one career against the student profile (deterministic). */
export function scoreCareer(career: Career, input: RecommendInput): Scored {
  const W = RECOMMENDATION_WEIGHTS
  const matchedRoute = career.route === input.primaryRoute

  let clusterPts = 0
  const matchedClusters: Cluster[] = []
  if (career.clusterBias.includes(input.primaryCluster)) {
    clusterPts = W.clusterPrimary
    matchedClusters.push(input.primaryCluster)
  } else if (career.clusterBias.includes(input.secondaryCluster)) {
    clusterPts = W.clusterSecondary
    matchedClusters.push(input.secondaryCluster)
  }

  const matchedSubjects = overlap(career.subjectTags, input.favoriteSubjects)
  const matchedGoals = overlap(career.goalTags, input.currentGoals)
  const subjectPts = Math.min(W.subjectOverlapMax, matchedSubjects.length * W.subjectOverlapPerHit)
  const goalPts = Math.min(W.goalOverlapMax, matchedGoals.length * W.goalOverlapPerHit)
  const marketPts = Math.round((career.marketRelevance / 100) * W.marketMax)
  const gradePts =
    input.gradeLevel != null && input.gradeLevel >= 8 && input.gradeLevel <= 11
      ? W.gradeFeasibility
      : 0

  const score =
    (matchedRoute ? W.routeMatch : 0) + clusterPts + subjectPts + goalPts + marketPts + gradePts

  return {
    slug: career.slug,
    score,
    matchedRoute,
    matchedClusters,
    matchedSubjects,
    matchedGoals,
    skillGaps: career.skillTags.slice(0, 2),
    route: career.route,
    clusterMatched: matchedClusters.length > 0,
    interestMatched: matchedSubjects.length > 0 || matchedGoals.length > 0,
  }
}

function sortByScore(a: Scored, b: Scored): number {
  if (b.score !== a.score) return b.score - a.score
  const ma = CAREERS_BY_SLUG[a.slug]?.marketRelevance ?? 0
  const mb = CAREERS_BY_SLUG[b.slug]?.marketRelevance ?? 0
  if (mb !== ma) return mb - ma
  return a.slug.localeCompare(b.slug)
}

function finalize(s: Scored, bucket: RecommendationBucket): CareerRecommendation {
  return {
    slug: s.slug,
    score: s.score,
    bucket,
    confidenceLevel: confidence(s.score),
    matchedRoute: s.matchedRoute,
    matchedClusters: s.matchedClusters,
    matchedSubjects: s.matchedSubjects,
    matchedGoals: s.matchedGoals,
    skillGaps: s.skillGaps,
    route: s.route,
  }
}

/**
 * Recommendation engine v2. Returns a flat list (~7) tagged into buckets:
 *   recommended  — best fit, on the student's primary route
 *   exploratory  — adjacent cluster, off the primary route (worth exploring)
 *   stretch      — high interest (subjects/goals) but route mismatch (skill gap)
 * Deterministic ordering: score, then market relevance, then slug.
 */
export function recommendCareers(input: RecommendInput): CareerRecommendation[] {
  const careers = input.careers ?? CAREERS
  const scored = careers.map((c) => scoreCareer(c, input)).sort(sortByScore)

  const used = new Set<string>()
  const take = (pool: Scored[], n: number): Scored[] => {
    const out: Scored[] = []
    for (const s of pool) {
      if (out.length >= n) break
      if (used.has(s.slug)) continue
      used.add(s.slug)
      out.push(s)
    }
    return out
  }

  const recommended = take(
    scored.filter((s) => s.matchedRoute),
    RECOMMENDATION_TOP_RECOMMENDED,
  )
  const exploratory = take(
    scored.filter((s) => !s.matchedRoute && s.clusterMatched),
    RECOMMENDATION_TOP_EXPLORATORY,
  )
  const stretch = take(
    scored.filter((s) => !s.matchedRoute && s.interestMatched),
    RECOMMENDATION_TOP_STRETCH,
  )

  return [
    ...recommended.map((s) => finalize(s, 'recommended')),
    ...exploratory.map((s) => finalize(s, 'exploratory')),
    ...stretch.map((s) => finalize(s, 'stretch')),
  ]
}

/** Split a flat recommendation list back into its buckets (for the UI). */
export function groupRecommendations(recs: CareerRecommendation[]) {
  return {
    recommended: recs.filter((r) => r.bucket === 'recommended'),
    exploratory: recs.filter((r) => r.bucket === 'exploratory'),
    stretch: recs.filter((r) => r.bucket === 'stretch'),
  }
}
