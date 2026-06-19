import { ASSESSMENT_ITEMS, BLOCKS, ITEM_CODES, type Block } from './assessment-items'
import {
  calculateAwarenessIndex,
  classifyAwareness,
  rawToPct,
  rescaleToRaw,
  type AwarenessLevel,
  type IpoCriteria,
} from './awareness-index'
import { CLUSTER_ITEMS, CLUSTERS, type Cluster } from './clusters'
import {
  buildGrowthAreas,
  buildStrengths,
  rankClusters,
  resolvePrimaryAndSecondaryCluster,
  resolveRoute,
} from './recommendation-rules'
import type { Route } from './routes'
import {
  AWARENESS_METHOD,
  LIKERT_MAX,
  LIKERT_MIN,
  METHODOLOGY_VERSION,
  SCORING_VERSION,
  TEMPLATE_VERSION,
  TOTAL_ITEMS,
  type OnboardingContext,
} from './scoring-config'

export type AnswerMap = Record<string, number> // item code -> 1..5

function mean(values: number[]): number {
  if (values.length === 0) return LIKERT_MIN
  return values.reduce((sum, v) => sum + v, 0) / values.length
}
function likertMeanToPct(meanValue: number): number {
  return Math.round(((meanValue - LIKERT_MIN) / (LIKERT_MAX - LIKERT_MIN)) * 100)
}
function answersFor(codes: string[], answers: AnswerMap): number[] {
  return codes.map((code) => answers[code]).filter((v): v is number => typeof v === 'number')
}

/** Normalized 0–100 score per block (pure). */
export function calculateBlockScores(answers: AnswerMap): Record<Block, number> {
  const blockScores = {} as Record<Block, number>
  for (const block of BLOCKS) {
    const codes = ASSESSMENT_ITEMS.filter((i) => i.block === block).map((i) => i.code)
    blockScores[block] = likertMeanToPct(mean(answersFor(codes, answers)))
  }
  return blockScores
}

/** Normalized 0–100 score per cluster (pure; tolerant of overlap + uneven counts). */
export function calculateClusterScores(answers: AnswerMap): Record<Cluster, number> {
  const clusterScores = {} as Record<Cluster, number>
  for (const cluster of CLUSTERS) {
    clusterScores[cluster] = likertMeanToPct(mean(answersFor(CLUSTER_ITEMS[cluster], answers)))
  }
  return clusterScores
}

export interface ScoredResult {
  methodologyVersion: string
  templateVersion: string
  scoringVersion: string
  ipoRaw60: number
  ipoPct100: number
  awarenessLevel: AwarenessLevel
  ipoCriteria: IpoCriteria
  blockScores: Record<Block, number>
  clusterScores: Record<Cluster, number>
  primaryCluster: Cluster
  secondaryCluster: Cluster
  primaryRoute: Route
  routeModifier?: string
  strengths: Block[]
  growthAreas: Block[]
  answeredCount: number
}

export interface ScoreOptions {
  onboarding?: OnboardingContext
  planGenerated?: boolean
}

/**
 * Pure, deterministic scoring engine. This is the canonical source of truth for
 * a student's result (AI never decides the score). No I/O.
 */
export function scoreAssessment(answers: AnswerMap, options: ScoreOptions = {}): ScoredResult {
  const blockScores = calculateBlockScores(answers)
  const clusterScores = calculateClusterScores(answers)
  const rankedClusters = rankClusters(clusterScores)
  const { primary: primaryCluster, secondary: secondaryCluster } =
    resolvePrimaryAndSecondaryCluster(clusterScores)
  const { primaryRoute, routeModifier } = resolveRoute(
    primaryCluster,
    secondaryCluster,
    clusterScores,
  )

  const allValues = answersFor(ITEM_CODES, answers)

  let ipoRaw60: number
  let ipoPct100: number
  let awarenessLevel: AwarenessLevel
  let ipoCriteria: IpoCriteria

  if (AWARENESS_METHOD === 'ipo_v1') {
    const ipo = calculateAwarenessIndex({
      blockScores,
      clusterScores,
      rankedClusters,
      onboarding: options.onboarding,
      planGenerated: options.planGenerated,
    })
    ipoRaw60 = ipo.raw60
    ipoPct100 = ipo.pct100
    awarenessLevel = ipo.level
    ipoCriteria = ipo.criteria
  } else {
    const total = allValues.reduce((sum, v) => sum + v, 0)
    ipoRaw60 = rescaleToRaw(total, TOTAL_ITEMS)
    ipoPct100 = rawToPct(ipoRaw60)
    awarenessLevel = classifyAwareness(ipoRaw60)
    ipoCriteria = {
      self_understanding: 0,
      skills_awareness: 0,
      career_information: 0,
      independence: 0,
      confidence: 0,
      planning: 0,
    }
  }

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    templateVersion: TEMPLATE_VERSION,
    scoringVersion: SCORING_VERSION,
    ipoRaw60,
    ipoPct100,
    awarenessLevel,
    ipoCriteria,
    blockScores,
    clusterScores,
    primaryCluster,
    secondaryCluster,
    primaryRoute,
    routeModifier,
    strengths: buildStrengths(clusterScores, blockScores, options.onboarding),
    growthAreas: buildGrowthAreas(clusterScores, blockScores, ipoCriteria),
    answeredCount: allValues.length,
  }
}

export interface StudentResultSnapshot {
  methodology_version: string
  scoring_version: string
  template_version: string
  career_readiness: {
    raw_60: number
    pct_100: number
    level: AwarenessLevel
    criteria: IpoCriteria
  }
  route: { primary: Route; modifier?: string }
  clusters: { primary: Cluster; secondary: Cluster; scores: Record<Cluster, number> }
  blocks: Record<Block, number>
  strengths: Block[]
  growth_areas: Block[]
  answered_count: number
}

/** Serialize a scored result into a stable, versioned snapshot (for DB/result_json). */
export function buildStudentResultSnapshot(result: ScoredResult): StudentResultSnapshot {
  return {
    methodology_version: result.methodologyVersion,
    scoring_version: result.scoringVersion,
    template_version: result.templateVersion,
    career_readiness: {
      raw_60: result.ipoRaw60,
      pct_100: result.ipoPct100,
      level: result.awarenessLevel,
      criteria: result.ipoCriteria,
    },
    route: { primary: result.primaryRoute, modifier: result.routeModifier },
    clusters: {
      primary: result.primaryCluster,
      secondary: result.secondaryCluster,
      scores: result.clusterScores,
    },
    blocks: result.blockScores,
    strengths: result.strengths,
    growth_areas: result.growthAreas,
    answered_count: result.answeredCount,
  }
}
