import { describe, expect, it } from 'vitest'
import { groupRecommendations, recommendCareers } from '@/lib/methodology/recommendations'

const input = {
  primaryRoute: 'technological' as const,
  primaryCluster: 'digital_innovator' as const,
  secondaryCluster: 'researcher' as const,
  favoriteSubjects: ['informatics', 'mathematics'],
  currentGoals: [],
  gradeLevel: 10,
}

describe('recommendCareers v2 (buckets)', () => {
  it('returns recommended, exploratory, and a stretch bucket', () => {
    const g = groupRecommendations(recommendCareers(input))
    expect(g.recommended.length).toBeGreaterThan(0)
    expect(g.recommended.length).toBeLessThanOrEqual(3)
    expect(g.exploratory.length).toBeLessThanOrEqual(3)
    expect(g.stretch.length).toBeLessThanOrEqual(1)
  })

  it('recommended careers are on the primary route, highest first', () => {
    const g = groupRecommendations(recommendCareers(input))
    for (const r of g.recommended) {
      expect(r.route).toBe('technological')
      expect(r.matchedRoute).toBe(true)
    }
    for (let i = 1; i < g.recommended.length; i++) {
      expect(g.recommended[i - 1].score).toBeGreaterThanOrEqual(g.recommended[i].score)
    }
  })

  it('exploratory careers are OFF the primary route', () => {
    const g = groupRecommendations(recommendCareers(input))
    for (const r of g.exploratory) expect(r.matchedRoute).toBe(false)
  })

  it('every recommendation has a confidence level and no duplicates', () => {
    const recs = recommendCareers(input)
    const slugs = recs.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const r of recs) expect(['low', 'medium', 'high']).toContain(r.confidenceLevel)
  })

  it('is deterministic', () => {
    expect(recommendCareers(input)).toEqual(recommendCareers(input))
  })
})
