// Professional clusters and the PROPOSED item→cluster mapping.
//
// IMPORTANT (read docs/METHODOLOGY_ASSUMPTIONS.md):
// CLUSTER_ITEMS below is `PROPOSED_MAPPING_V1` — a productization mapping, NOT a
// validated clinical scoring key from the thesis. Two properties are intentional:
//   1. Overlaps: some items contribute to more than one cluster (e.g. Q40).
//   2. Uneven counts: clusters have 8–10 items each.
// Because counts are uneven, cluster scores MUST be normalized (see scoring.ts),
// never compared as raw sums.

export const CLUSTERS = [
  'digital_innovator',
  'researcher',
  'social_leader',
  'strategist',
  'creator',
] as const

export type Cluster = (typeof CLUSTERS)[number]

export const PROPOSED_MAPPING_VERSION = 'PROPOSED_MAPPING_V1'

export const CLUSTER_ITEMS: Record<Cluster, string[]> = {
  digital_innovator: ['Q1', 'Q5', 'Q10', 'Q12', 'Q16', 'Q23', 'Q31', 'Q37', 'Q40'],
  researcher: ['Q4', 'Q8', 'Q10', 'Q11', 'Q16', 'Q20', 'Q23', 'Q29', 'Q34', 'Q40'],
  social_leader: ['Q2', 'Q6', 'Q13', 'Q18', 'Q22', 'Q25', 'Q32', 'Q35'],
  strategist: ['Q9', 'Q14', 'Q17', 'Q19', 'Q25', 'Q26', 'Q31', 'Q36', 'Q39'],
  creator: ['Q3', 'Q7', 'Q15', 'Q24', 'Q30', 'Q33', 'Q37', 'Q40'],
}

export const CLUSTER_ORDER: readonly Cluster[] = CLUSTERS

export function isCluster(value: string): value is Cluster {
  return (CLUSTERS as readonly string[]).includes(value)
}
