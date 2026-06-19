import { describe, expect, it } from 'vitest'
import { PLAN_HORIZONS, generatePlan } from '@/lib/methodology/plan-templates'

describe('multi-horizon plan generation', () => {
  it('produces the right number of months per horizon (1/2/3/6)', () => {
    const counts: Record<number, number> = { 1: 1, 2: 2, 3: 3, 6: 6 }
    for (const h of PLAN_HORIZONS) {
      const plan = generatePlan('technological', h, 'en', 'Technological')
      expect(plan.horizonMonths).toBe(h)
      expect(plan.months).toHaveLength(counts[h])
    }
  })

  it('each month has theme/goal/reflection/metric and 4 weekly actions', () => {
    const plan = generatePlan('creative', 6, 'en', 'Creative')
    for (const m of plan.months) {
      expect(m.theme).toBeTruthy()
      expect(m.goal).toBeTruthy()
      expect(m.reflectionPrompt).toBeTruthy()
      expect(m.successMetric).toBeTruthy()
      expect(m.weeks).toHaveLength(4)
      for (const w of m.weeks) {
        expect(w.title).toBeTruthy()
        expect(['explore', 'learn', 'practice', 'talk', 'reflect', 'decide']).toContain(w.category)
      }
    }
  })

  it('interpolates the route name and leaves no placeholders', () => {
    const text = JSON.stringify(generatePlan('technological', 1, 'en', 'Technological'))
    expect(text).toContain('Technological')
    expect(text).not.toContain('{route}')
    expect(text).not.toContain('{topic}')
  })

  it('is deterministic', () => {
    expect(generatePlan('research', 3, 'ru', 'Исследование')).toEqual(
      generatePlan('research', 3, 'ru', 'Исследование'),
    )
  })
})
