import { describe, expect, it } from 'vitest'
import { ITEM_CODES } from '@/lib/methodology/assessment-items'
import { CLUSTERS, CLUSTER_ITEMS } from '@/lib/methodology/clusters'
import { CLUSTER_ROUTE } from '@/lib/methodology/recommendation-rules'
import { ROUTES } from '@/lib/methodology/routes'

describe('cluster mapping (PROPOSED_MAPPING_V1)', () => {
  it('references only valid item codes', () => {
    for (const cluster of CLUSTERS) {
      for (const code of CLUSTER_ITEMS[cluster]) {
        expect(ITEM_CODES).toContain(code)
      }
    }
  })

  it('gives every cluster a reasonable number of items', () => {
    for (const cluster of CLUSTERS) {
      expect(CLUSTER_ITEMS[cluster].length).toBeGreaterThanOrEqual(5)
    }
  })

  it('maps every cluster to a valid route', () => {
    for (const cluster of CLUSTERS) {
      expect(ROUTES).toContain(CLUSTER_ROUTE[cluster])
    }
  })
})
