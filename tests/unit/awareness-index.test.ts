import { describe, expect, it } from 'vitest'
import { classifyAwareness, rawToPct, rescaleToRaw } from '@/lib/methodology/awareness-index'

describe('awareness index', () => {
  it('classifies thresholds: low <30, medium 30-47, high 48-60', () => {
    expect(classifyAwareness(0)).toBe('low')
    expect(classifyAwareness(29)).toBe('low')
    expect(classifyAwareness(30)).toBe('medium')
    expect(classifyAwareness(47)).toBe('medium')
    expect(classifyAwareness(48)).toBe('high')
    expect(classifyAwareness(60)).toBe('high')
  })

  it('converts canonical raw (0-60) to percentage (0-100)', () => {
    expect(rawToPct(60)).toBe(100)
    expect(rawToPct(30)).toBe(50)
    expect(rawToPct(0)).toBe(0)
  })

  it('rescales the full-instrument total onto 0..60', () => {
    expect(rescaleToRaw(40, 40)).toBe(0) // all 1s
    expect(rescaleToRaw(200, 40)).toBe(60) // all 5s
    expect(rescaleToRaw(120, 40)).toBe(30) // all 3s -> midpoint
  })
})
