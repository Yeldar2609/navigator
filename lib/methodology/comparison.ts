import type { Block } from './assessment-items'
import type { Cluster } from './clusters'
import type { Route } from './routes'
import type { ScoredResult } from './scoring'

// Comparing two assessment attempts. Framed as learning, not judgment — a changed
// route or a lower score is normal and surfaced gently in the UI.
export interface ResultComparison {
  previousRoute: Route
  currentRoute: Route
  routeChanged: boolean
  previousScore: number
  currentScore: number
  scoreDelta: number
  previousCluster: Cluster
  currentCluster: Cluster
  clusterChanged: boolean
  consistentStrengths: Block[] // strengths present in BOTH attempts
  newGrowthAreas: Block[] // growth areas new to the current attempt
}

export function compareResults(previous: ScoredResult, current: ScoredResult): ResultComparison {
  const prevStrengths = new Set(previous.strengths)
  const prevGrowth = new Set(previous.growthAreas)
  return {
    previousRoute: previous.primaryRoute,
    currentRoute: current.primaryRoute,
    routeChanged: previous.primaryRoute !== current.primaryRoute,
    previousScore: previous.ipoPct100,
    currentScore: current.ipoPct100,
    scoreDelta: current.ipoPct100 - previous.ipoPct100,
    previousCluster: previous.primaryCluster,
    currentCluster: current.primaryCluster,
    clusterChanged: previous.primaryCluster !== current.primaryCluster,
    consistentStrengths: current.strengths.filter((s) => prevStrengths.has(s)),
    newGrowthAreas: current.growthAreas.filter((g) => !prevGrowth.has(g)),
  }
}
