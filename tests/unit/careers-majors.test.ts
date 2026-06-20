import { describe, expect, it } from 'vitest'
import { CAREERS } from '@/lib/methodology/careers-data'
import { MAJORS, MAJORS_BY_SLUG, relatedMajorsFor } from '@/lib/methodology/majors-data'
import { ROUTES } from '@/lib/methodology/routes'

describe('careers seed (Day-6 production catalog)', () => {
  it('has at least 100 careers, balanced across routes', () => {
    expect(CAREERS.length).toBeGreaterThanOrEqual(100)
    for (const route of ROUTES) {
      // Balanced coverage: every route carries a meaningful share of the catalog.
      expect(CAREERS.filter((c) => c.route === route).length).toBeGreaterThanOrEqual(15)
    }
  })

  it('has unique slugs and trilingual names', () => {
    const slugs = CAREERS.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const c of CAREERS) {
      expect(c.name.en && c.name.ru && c.name.kk).toBeTruthy()
    }
  })
})

describe('majors seed', () => {
  it('has at least 30 majors with unique slugs and trilingual names', () => {
    expect(MAJORS.length).toBeGreaterThanOrEqual(30)
    const slugs = MAJORS.map((m) => m.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const m of MAJORS) {
      expect(m.name.en && m.name.ru && m.name.kk).toBeTruthy()
    }
  })

  it('relatedMajorsFor returns 1–4 valid majors for every career', () => {
    for (const c of CAREERS) {
      const related = relatedMajorsFor(c)
      expect(related.length).toBeGreaterThan(0)
      expect(related.length).toBeLessThanOrEqual(4)
      for (const m of related) expect(MAJORS_BY_SLUG[m.slug]).toBeDefined()
    }
  })
})
