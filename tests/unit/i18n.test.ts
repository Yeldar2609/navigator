import { describe, expect, it } from 'vitest'
import { defaultLocale, isLocale, localeLabels, locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'

describe('i18n config', () => {
  it('supports exactly kk, ru, en', () => {
    expect(locales).toHaveLength(3)
    expect(locales).toContain('kk')
    expect(locales).toContain('ru')
    expect(locales).toContain('en')
  })

  it('default locale is a supported locale', () => {
    expect(isLocale(defaultLocale)).toBe(true)
  })

  it('every locale has a non-empty label', () => {
    for (const l of locales) expect(localeLabels[l]).toBeTruthy()
  })

  it('every locale resolves a dictionary with identical top-level keys', () => {
    const enKeys = Object.keys(getDictionary('en')).sort()
    for (const l of locales) {
      expect(Object.keys(getDictionary(l)).sort()).toEqual(enKeys)
    }
  })
})
