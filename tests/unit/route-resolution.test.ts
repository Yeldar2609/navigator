import { describe, expect, it } from 'vitest'
import { CLUSTERS, type Cluster } from '@/lib/methodology/clusters'
import {
  resolvePrimaryAndSecondaryCluster,
  resolveRoute,
} from '@/lib/methodology/recommendation-rules'

function scores(partial: Partial<Record<Cluster, number>>): Record<Cluster, number> {
  const base = Object.fromEntries(CLUSTERS.map((c) => [c, 10])) as Record<Cluster, number>
  return { ...base, ...partial }
}

function resolve(partial: Partial<Record<Cluster, number>>) {
  const s = scores(partial)
  const { primary, secondary } = resolvePrimaryAndSecondaryCluster(s)
  return resolveRoute(primary, secondary, s)
}

describe('resolveRoute', () => {
  it('maps a clear top cluster to its route', () => {
    expect(resolve({ digital_innovator: 90 }).primaryRoute).toBe('technological')
    expect(resolve({ researcher: 90 }).primaryRoute).toBe('research')
    expect(resolve({ social_leader: 90 }).primaryRoute).toBe('social_humanitarian')
    expect(resolve({ strategist: 90 }).primaryRoute).toBe('managerial')
    expect(resolve({ creator: 90 }).primaryRoute).toBe('creative')
  })

  it('breaks a close social_leader + strategist tie toward managerial', () => {
    expect(resolve({ social_leader: 80, strategist: 78 }).primaryRoute).toBe('managerial')
  })

  it('breaks a close digital_innovator + researcher tie toward technological', () => {
    expect(resolve({ digital_innovator: 80, researcher: 75 }).primaryRoute).toBe('technological')
  })

  it('flags a close creator + social_leader tie as a creative-social hybrid', () => {
    const r = resolve({ creator: 80, social_leader: 79 })
    expect(r.primaryRoute).toBe('creative')
    expect(r.routeModifier).toBe('creative_social_hybrid')
  })

  it('does not apply a tie-break when the gap exceeds the threshold', () => {
    expect(resolve({ social_leader: 90, strategist: 70 }).primaryRoute).toBe('social_humanitarian')
  })
})
