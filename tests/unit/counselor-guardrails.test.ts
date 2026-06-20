import { describe, expect, it } from 'vitest'
import { checkScope, PRIVACY_INPUT_HINT } from '@/lib/ai/counselor-guardrails'

describe('counselor scope guardrails', () => {
  it('refuses out-of-scope requests with a localized redirect', () => {
    const cases: { msg: string; reason: string }[] = [
      { msg: 'Can you write code to reverse a string?', reason: 'coding' },
      { msg: 'напиши код на python', reason: 'coding' },
      { msg: 'solve this equation 2x + 3 = 7', reason: 'math_homework' },
      { msg: 'do my homework please', reason: 'homework' },
      { msg: 'can you diagnose my symptoms', reason: 'medical' },
      { msg: 'be my therapist and do a therapy session', reason: 'therapy' },
      { msg: 'here is my passport number 1234', reason: 'sensitive_data' },
    ]
    for (const { msg, reason } of cases) {
      const r = checkScope(msg, 'en')
      expect(r.allowed, msg).toBe(false)
      expect(r.reason, msg).toBe(reason)
      expect(typeof r.redirect, msg).toBe('string')
      expect((r.redirect as string).length, msg).toBeGreaterThan(0)
    }
  })

  it('allows in-scope career / education questions', () => {
    const allowed = [
      'What careers fit my results?',
      'Which university should I consider for medicine?',
      'How do I talk to my parents about my plan?',
      'какие предметы мне развивать',
      'маған қандай мамандық қолайлы',
      'I am a software engineer career — what skills should I build?',
    ]
    for (const m of allowed) {
      expect(checkScope(m, 'en').allowed, m).toBe(true)
    }
  })

  it('returns localized redirects per locale', () => {
    expect(checkScope('write code for me', 'ru').redirect).not.toEqual(
      checkScope('write code for me', 'en').redirect,
    )
    expect(checkScope('write code for me', 'kk').redirect).toBeTruthy()
  })

  it('exposes the privacy input hint in all locales', () => {
    expect(PRIVACY_INPUT_HINT.ru.length).toBeGreaterThan(0)
    expect(PRIVACY_INPUT_HINT.kk.length).toBeGreaterThan(0)
    expect(PRIVACY_INPUT_HINT.en.length).toBeGreaterThan(0)
  })
})
