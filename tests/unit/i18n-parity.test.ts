import { describe, expect, it } from 'vitest'
import { locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'

// Day-5 hardening: deep (every-depth) key parity across locales. The dictionaries
// are also typed `: Messages`, so drift fails `tsc` — this runtime guard reports
// the exact missing/extra key paths and catches untranslated placeholders.
const TODO_MARKER = 'TODO_TRANSLATION_REVIEW'

function leafKeyPaths(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leafKeyPaths(v, prefix ? `${prefix}.${k}` : k),
  )
}

function leafValues(obj: unknown): string[] {
  return obj === null || typeof obj !== 'object'
    ? [String(obj)]
    : Object.values(obj as Record<string, unknown>).flatMap(leafValues)
}

describe('i18n deep key parity', () => {
  const enPaths = new Set(leafKeyPaths(getDictionary('en')))

  for (const locale of locales) {
    it(`${locale} has exactly the same keys as en`, () => {
      const paths = new Set(leafKeyPaths(getDictionary(locale)))
      const missing = [...enPaths].filter((p) => !paths.has(p))
      const extra = [...paths].filter((p) => !enPaths.has(p))
      // Reports the offending paths on failure.
      expect({ locale, missing, extra }).toEqual({ locale, missing: [], extra: [] })
    })
  }

  it('no leaf is left as an untranslated placeholder', () => {
    for (const locale of locales) {
      expect(leafValues(getDictionary(locale))).not.toContain(TODO_MARKER)
    }
  })
})
