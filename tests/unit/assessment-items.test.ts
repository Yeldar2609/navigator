import { describe, expect, it } from 'vitest'
import { locales } from '@/lib/i18n/config'
import {
  ASSESSMENT_ITEMS,
  BLOCKS,
  ITEM_CODES,
  ITEM_PROMPTS,
  itemsByBlock,
} from '@/lib/methodology/assessment-items'

describe('assessment items', () => {
  it('has exactly 40 items', () => {
    expect(ASSESSMENT_ITEMS).toHaveLength(40)
  })

  it('every item has a valid block and a prompt key', () => {
    for (const item of ASSESSMENT_ITEMS) {
      expect(BLOCKS).toContain(item.block)
      expect(item.promptKey).toMatch(/^assessment\.items\.Q\d+$/)
    }
  })

  it('has 10 items in each of the 4 blocks', () => {
    expect(BLOCKS).toHaveLength(4)
    for (const block of BLOCKS) expect(itemsByBlock(block)).toHaveLength(10)
  })

  it('codes are unique and span Q1..Q40', () => {
    expect(new Set(ITEM_CODES).size).toBe(40)
    expect(ITEM_CODES).toContain('Q1')
    expect(ITEM_CODES).toContain('Q40')
  })

  it('has a localized prompt for every item in every locale', () => {
    for (const code of ITEM_CODES) {
      for (const l of locales) expect(ITEM_PROMPTS[code]?.[l]).toBeTruthy()
    }
  })
})
