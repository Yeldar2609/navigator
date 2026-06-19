import { describe, expect, it } from 'vitest'
import { ITEM_CODES } from '@/lib/methodology/assessment-items'
import { scoreAssessment, type AnswerMap } from '@/lib/methodology/scoring'
import { compareResults } from '@/lib/methodology/comparison'

const answersAll = (v: number): AnswerMap => Object.fromEntries(ITEM_CODES.map((c) => [c, v]))

describe('result comparison', () => {
  it('computes the score delta and keeps consistency a subset of current', () => {
    const prev = scoreAssessment(answersAll(2))
    const cur = scoreAssessment(answersAll(4))
    const cmp = compareResults(prev, cur)
    expect(cmp.scoreDelta).toBe(cur.ipoPct100 - prev.ipoPct100)
    expect(cmp.currentScore).toBe(cur.ipoPct100)
    expect(cmp.previousScore).toBe(prev.ipoPct100)
    for (const s of cmp.consistentStrengths) expect(cur.strengths).toContain(s)
  })

  it('identical attempts show no change', () => {
    const a = scoreAssessment(answersAll(3))
    const b = scoreAssessment(answersAll(3))
    const cmp = compareResults(a, b)
    expect(cmp.routeChanged).toBe(false)
    expect(cmp.clusterChanged).toBe(false)
    expect(cmp.scoreDelta).toBe(0)
  })
})
