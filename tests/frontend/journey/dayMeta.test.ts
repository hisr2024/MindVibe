/**
 * Unit tests for journey day metadata and progress calculation.
 */

import { describe, it, expect } from 'vitest'
import {
  JOURNEY_DAY_META,
  TOTAL_JOURNEY_DAYS,
  getDayMeta,
  calculateProgress,
} from '@/lib/journey/dayMeta'

describe('JOURNEY_DAY_META', () => {
  it('contains exactly 14 entries', () => {
    expect(JOURNEY_DAY_META).toHaveLength(14)
  })

  it('has sequential day numbers 1–14', () => {
    const days = JOURNEY_DAY_META.map((d) => d.day)
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
  })

  it('every entry has a non-empty theme, focus, and microPractice', () => {
    for (const meta of JOURNEY_DAY_META) {
      expect(meta.theme.length).toBeGreaterThan(0)
      expect(meta.focus.length).toBeGreaterThan(0)
      expect(meta.microPractice.length).toBeGreaterThan(0)
    }
  })

  it('day 14 theme says "Practice continues"', () => {
    const day14 = JOURNEY_DAY_META.find((d) => d.day === 14)
    expect(day14?.theme).toBe('Practice continues')
  })

  it('TOTAL_JOURNEY_DAYS equals 14', () => {
    expect(TOTAL_JOURNEY_DAYS).toBe(14)
  })
})

describe('getDayMeta', () => {
  it('returns correct metadata for day 1', () => {
    const meta = getDayMeta(1)
    expect(meta).toBeDefined()
    expect(meta?.day).toBe(1)
    expect(meta?.theme).toBe('Stillness within chaos')
    expect(meta?.focus).toBe('Dhriti (Steadfastness)')
  })

  it('returns correct metadata for day 14', () => {
    const meta = getDayMeta(14)
    expect(meta).toBeDefined()
    expect(meta?.day).toBe(14)
    expect(meta?.theme).toBe('Practice continues')
    expect(meta?.focus).toBe('Abhyasa (Steady practice)')
  })

  it('returns undefined for day 0', () => {
    expect(getDayMeta(0)).toBeUndefined()
  })

  it('returns undefined for day 15', () => {
    expect(getDayMeta(15)).toBeUndefined()
  })

  it('returns undefined for negative day', () => {
    expect(getDayMeta(-1)).toBeUndefined()
  })
})

describe('calculateProgress', () => {
  it('returns 0 when no days completed', () => {
    expect(calculateProgress(0)).toBe(0)
  })

  it('returns 100 when all 14 days completed', () => {
    expect(calculateProgress(14)).toBe(100)
  })

  it('returns 50 when 7 of 14 days completed', () => {
    expect(calculateProgress(7)).toBe(50)
  })

  it('returns 7 when 1 of 14 days completed', () => {
    expect(calculateProgress(1)).toBe(7)
  })

  it('returns rounded percentage for non-even divisions', () => {
    // 3/14 = 21.43% → rounds to 21
    expect(calculateProgress(3)).toBe(21)
  })

  it('clamps to 100 if completed exceeds total', () => {
    expect(calculateProgress(20, 14)).toBe(100)
  })

  it('returns 0 for zero totalDays', () => {
    expect(calculateProgress(5, 0)).toBe(0)
  })

  it('returns 0 for negative totalDays', () => {
    expect(calculateProgress(5, -1)).toBe(0)
  })

  it('works with custom totalDays', () => {
    expect(calculateProgress(5, 10)).toBe(50)
    expect(calculateProgress(3, 10)).toBe(30)
  })

  it('never returns negative', () => {
    expect(calculateProgress(-5, 14)).toBe(0)
  })
})
