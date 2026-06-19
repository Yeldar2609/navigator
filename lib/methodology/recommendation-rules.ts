import { BLOCKS, type Block } from './assessment-items'
import type { IpoCriteria } from './awareness-index'
import { CLUSTERS, type Cluster } from './clusters'
import type { Route } from './routes'
import { ROUTE_TIE_THRESHOLD, type OnboardingContext } from './scoring-config'

// 1:1 cluster → primary route mapping (proposed; see assumptions doc).
export const CLUSTER_ROUTE: Record<Cluster, Route> = {
  digital_innovator: 'technological',
  researcher: 'research',
  strategist: 'managerial',
  social_leader: 'social_humanitarian',
  creator: 'creative',
}

export function routeForCluster(cluster: Cluster): Route {
  return CLUSTER_ROUTE[cluster]
}

export interface RecommendationInput {
  clusterScores: Record<Cluster, number> // 0..100
  blockScores: Record<Block, number> // 0..100
}

export type RecommendationKind = 'explore_route' | 'build_skill' | 'reflect'

export interface Recommendation {
  kind: RecommendationKind
  route?: Route
  cluster?: Cluster
  block?: Block
  messageKey: string
}

export interface RecommendationOutput {
  primaryCluster: Cluster
  secondaryCluster: Cluster
  primaryRoute: Route
  strengths: Block[] // top 2 blocks
  growthAreas: Block[] // bottom 2 blocks (lowest first)
  recommendations: Recommendation[]
}

export function rankClusters(scores: Record<Cluster, number>): Cluster[] {
  return [...CLUSTERS].sort((a, b) => scores[b] - scores[a])
}

export function rankBlocks(scores: Record<Block, number>): Block[] {
  return [...BLOCKS].sort((a, b) => scores[b] - scores[a])
}

export function buildRecommendations(input: RecommendationInput): RecommendationOutput {
  const clusterRank = rankClusters(input.clusterScores)
  const blockRank = rankBlocks(input.blockScores)

  const primaryCluster = clusterRank[0]
  const secondaryCluster = clusterRank[1] ?? clusterRank[0]
  const primaryRoute = routeForCluster(primaryCluster)
  const strengths = blockRank.slice(0, 2)
  const growthAreas = blockRank.slice(-2).reverse() // lowest first

  const recommendations: Recommendation[] = [
    {
      kind: 'explore_route',
      route: primaryRoute,
      cluster: primaryCluster,
      messageKey: 'recommendations.exploreRoute',
    },
    { kind: 'build_skill', block: growthAreas[0], messageKey: 'recommendations.buildSkill' },
    { kind: 'reflect', messageKey: 'recommendations.reflect' },
  ]

  return { primaryCluster, secondaryCluster, primaryRoute, strengths, growthAreas, recommendations }
}

export interface RouteResolution {
  primaryRoute: Route
  routeModifier?: string
}

/** Top-2 clusters by score (deterministic; stable on ties via CLUSTERS order). */
export function resolvePrimaryAndSecondaryCluster(clusterScores: Record<Cluster, number>): {
  primary: Cluster
  secondary: Cluster
} {
  const ranked = rankClusters(clusterScores)
  return { primary: ranked[0], secondary: ranked[1] ?? ranked[0] }
}

/**
 * Resolve the primary route from the top-2 clusters, applying close-call
 * tie-breaks when they are within ROUTE_TIE_THRESHOLD points.
 * See docs/METHODOLOGY_ASSUMPTIONS.md → "Route resolution v1".
 */
export function resolveRoute(
  primaryCluster: Cluster,
  secondaryCluster: Cluster,
  clusterScores: Record<Cluster, number>,
): RouteResolution {
  const top1 = primaryCluster
  const top2 = secondaryCluster
  const close = Math.abs(clusterScores[top1] - clusterScores[top2]) <= ROUTE_TIE_THRESHOLD
  const pair = (a: Cluster, b: Cluster) => (top1 === a && top2 === b) || (top1 === b && top2 === a)

  if (close && top2 !== top1) {
    if (pair('social_leader', 'strategist')) return { primaryRoute: 'managerial' }
    if (pair('digital_innovator', 'researcher')) return { primaryRoute: 'technological' }
    if (pair('creator', 'social_leader'))
      return { primaryRoute: 'creative', routeModifier: 'creative_social_hybrid' }
  }
  return { primaryRoute: routeForCluster(top1) }
}

/** Top-2 assessment blocks (e.g. interests, strengths) the student leans into. */
export function buildStrengths(
  _clusterScores: Record<Cluster, number>,
  blockScores: Record<Block, number>,
  _onboarding?: OnboardingContext,
): Block[] {
  return rankBlocks(blockScores).slice(0, 2)
}

/** Bottom-2 blocks (lowest first) — framed as "areas to grow", never deficits. */
export function buildGrowthAreas(
  _clusterScores: Record<Cluster, number>,
  blockScores: Record<Block, number>,
  _awarenessCriteria?: IpoCriteria,
): Block[] {
  return rankBlocks(blockScores).slice(-2).reverse()
}
