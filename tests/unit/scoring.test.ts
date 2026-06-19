import { describe, expect, it } from 'vitest'
import { ITEM_CODES } from '@/lib/methodology/assessment-items'
import {
  buildStudentResultSnapshot,
  calculateBlockScores,
  calculateClusterScores,
  scoreAssessment,
} from '@/lib/methodology/scoring'
import { BLOCKS } from '@/lib/methodology/assessment-items'
import { CLUSTERS } from '@/lib/methodology/clusters'
import { ROUTES } from '@/lib/methodology/routes'

function uniform(value: number): Record<string, number> {
  return Object.fromEntries(ITEM_CODES.map((code) => [code, value]))
}

describe('scoreAssessment (IPO v1, named criteria)', () => {
  it('is deterministic — same input yields identical output', () => {
    const a = scoreAssessment(uniform(4), { onboarding: { careerConfidence: 4 } })
    const b = scoreAssessment(uniform(4), { onboarding: { careerConfidence: 4 } })
    expect(a).toEqual(b)
  })

  it('counts all 40 answers and yields a valid cluster + route + versions', () => {
    const r = scoreAssessment(uniform(3))
    expect(r.answeredCount).toBe(40)
    expect(CLUSTERS).toContain(r.primaryCluster)
    expect(ROUTES).toContain(r.primaryRoute)
    expect(r.strengths).toHaveLength(2)
    expect(r.methodologyVersion).toBeTruthy()
    expect(r.scoringVersion).toBeTruthy()
    expect(r.ipoRaw60).toBeGreaterThanOrEqual(0)
    expect(r.ipoRaw60).toBeLessThanOrEqual(60)
  })

  it('skills_awareness tracks the competencies block (all 5s => 10)', () => {
    expect(scoreAssessment(uniform(5)).ipoCriteria.skills_awareness).toBe(10)
  })

  it('career confidence drives career_information + confidence criteria', () => {
    const low = scoreAssessment(uniform(3), { onboarding: { careerConfidence: 1 } })
    const high = scoreAssessment(uniform(3), { onboarding: { careerConfidence: 5 } })
    expect(low.ipoCriteria.career_information).toBe(2)
    expect(high.ipoCriteria.career_information).toBe(10)
    expect(high.ipoCriteria.confidence).toBe(10)
    expect(high.ipoRaw60).toBeGreaterThan(low.ipoRaw60)
  })

  it('generating a plan raises planning from 4 to 8 (+4 raw)', () => {
    const before = scoreAssessment(uniform(4), { planGenerated: false })
    const after = scoreAssessment(uniform(4), { planGenerated: true })
    expect(before.ipoCriteria.planning).toBe(4)
    expect(after.ipoCriteria.planning).toBe(8)
    expect(after.ipoRaw60).toBe(before.ipoRaw60 + 4)
  })

  it('snapshot serializes versions + readiness', () => {
    const snap = buildStudentResultSnapshot(scoreAssessment(uniform(4)))
    expect(snap.methodology_version).toBeTruthy()
    expect(snap.career_readiness.criteria.self_understanding).toBeGreaterThanOrEqual(0)
    expect(['low', 'medium', 'high']).toContain(snap.career_readiness.level)
  })
})

describe('pure block/cluster calculators', () => {
  it('calculateBlockScores covers every block 0..100', () => {
    const s = calculateBlockScores(uniform(3))
    for (const b of BLOCKS) {
      expect(s[b]).toBeGreaterThanOrEqual(0)
      expect(s[b]).toBeLessThanOrEqual(100)
    }
  })
  it('calculateClusterScores covers every cluster 0..100', () => {
    const s = calculateClusterScores(uniform(5))
    for (const c of CLUSTERS) expect(s[c]).toBe(100)
  })
})
