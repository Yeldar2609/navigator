import type { Block } from './assessment-items'
import type { Cluster } from './clusters'
import {
  AWARENESS_CONFIG,
  AWARENESS_THRESHOLDS,
  IPO_V1,
  LIKERT_MAX,
  LIKERT_MIN,
  type OnboardingContext,
} from './scoring-config'

export type AwarenessLevel = 'low' | 'medium' | 'high'
export const AWARENESS_LEVELS: readonly AwarenessLevel[] = ['low', 'medium', 'high']

/**
 * Classify a canonical raw 0–60 awareness score.
 *   low: raw < 30 | medium: 30–47 | high: 48–60
 */
export function classifyAwareness(raw60: number): AwarenessLevel {
  if (raw60 < AWARENESS_THRESHOLDS.lowMaxExclusive) return 'low'
  if (raw60 <= AWARENESS_THRESHOLDS.mediumMaxInclusive) return 'medium'
  return 'high'
}

/** Normalized 0–100 percentage from the canonical raw (default max 60). */
export function rawToPct(raw60: number, rawMax: number = AWARENESS_CONFIG.rawMax): number {
  if (rawMax <= 0) return 0
  return Math.round((raw60 / rawMax) * 100)
}

/**
 * Linearly rescale a sum of Likert answers onto 0..rawMax (default 60).
 * minPossible/maxPossible derive from item count × Likert bounds, so the lowest
 * possible total maps to 0 and the highest to rawMax.
 */
export function rescaleToRaw(
  total: number,
  itemCount: number,
  rawMax: number = AWARENESS_CONFIG.rawMax,
): number {
  const min = itemCount * LIKERT_MIN
  const max = itemCount * LIKERT_MAX
  if (max === min) return 0
  const clamped = Math.min(Math.max(total, min), max)
  return Math.round(((clamped - min) / (max - min)) * rawMax)
}

export { AWARENESS_THRESHOLDS }

// --- IPO v1 (Day 2) -------------------------------------------------------
// 6 criteria, each 0–10, summed to the canonical 0–60 raw score. Deterministic
// given (block scores, cluster ranking, onboarding inputs, planGenerated).
// See docs/METHODOLOGY_ASSUMPTIONS.md → "IPO v1".
// The 6 Career Readiness criteria (each 0–10). Names are student-facing concepts.
export interface IpoCriteria {
  self_understanding: number
  skills_awareness: number
  career_information: number
  independence: number
  confidence: number
  planning: number
}

export const IPO_CRITERIA_KEYS = [
  'self_understanding',
  'skills_awareness',
  'career_information',
  'independence',
  'confidence',
  'planning',
] as const

export interface IpoResult {
  raw60: number
  pct100: number
  level: AwarenessLevel
  criteria: IpoCriteria
}

function clamp10(n: number): number {
  return Math.min(10, Math.max(0, Math.round(n)))
}

export interface AwarenessInputs {
  blockScores: Record<Block, number>
  clusterScores: Record<Cluster, number>
  rankedClusters: Cluster[]
  onboarding?: OnboardingContext
  planGenerated?: boolean
}

export function calculateAwarenessIndex(input: AwarenessInputs): IpoResult {
  const { blockScores, clusterScores, rankedClusters, onboarding, planGenerated } = input
  const top1 = clusterScores[rankedClusters[0]] ?? 0
  const top2 = clusterScores[rankedClusters[1]] ?? 0
  const cc = onboarding?.careerConfidence ?? IPO_V1.defaultCareerConfidence

  // 1. self_understanding: distinctiveness of the top cluster + interest completeness
  const distinct = Math.min(1, Math.max(0, (top1 - top2) / IPO_V1.interestDistinctnessGap))
  const self_understanding = clamp10(10 * (0.6 * distinct + 0.4 * (blockScores.interests / 100)))
  // 2. skills_awareness: competencies block average
  const skills_awareness = clamp10(10 * (blockScores.competencies / 100))
  // 3. career_information: from career confidence (demo default if unknown)
  const career_information = clamp10(10 * (cc / 5))
  // 4. independence: from support preference
  const independenceBase =
    (onboarding?.supportPreference && IPO_V1.independenceBySupport[onboarding.supportPreference]) ||
    IPO_V1.independenceDefault
  const independence = clamp10(10 * independenceBase)
  // 5. confidence: from career confidence
  const confidence = clamp10(10 * (cc / 5))
  // 6. planning: 4 before a plan exists, 8 after
  const planning = planGenerated ? IPO_V1.planAfter : IPO_V1.planBefore

  const criteria: IpoCriteria = {
    self_understanding,
    skills_awareness,
    career_information,
    independence,
    confidence,
    planning,
  }
  const raw60 = Object.values(criteria).reduce((sum, v) => sum + v, 0)
  return { raw60, pct100: rawToPct(raw60), level: classifyAwareness(raw60), criteria }
}

/** @deprecated Day-2 name. Use calculateAwarenessIndex. */
export const computeIpoV1 = calculateAwarenessIndex
