/**
 * KIAAN Vibe Music Player - Gita Data Tests
 *
 * Tests for the Gita data loading system.
 */

import { describe, it, expect } from 'vitest'
import {
  GITA_CHAPTERS_META,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  getAllChapters,
} from '@/lib/kiaan-vibe/gita'

describe('KIAAN Vibe Gita Data', () => {
  describe('Chapter Metadata', () => {
    it('should have all 18 chapters', () => {
      expect(GITA_CHAPTERS_META).toHaveLength(18)
    })

    it('should have correct chapter numbers', () => {
      GITA_CHAPTERS_META.forEach((chapter, index) => {
        expect(chapter.number).toBe(index + 1)
      })
    })

    it('should have names for all chapters', () => {
      GITA_CHAPTERS_META.forEach((chapter) => {
        expect(chapter.name).toBeTruthy()
        expect(chapter.nameSanskrit).toBeTruthy()
      })
    })

    it('should have verse counts for all chapters', () => {
      GITA_CHAPTERS_META.forEach((chapter) => {
        expect(chapter.verseCount).toBeGreaterThan(0)
      })
    })

    it('should have 700 total verses', () => {
      const totalVerses = GITA_CHAPTERS_META.reduce(
        (sum, chapter) => sum + chapter.verseCount,
        0
      )
      expect(totalVerses).toBe(700)
    })
  })

  describe('Supported Languages', () => {
    it('should have English as a supported language', () => {
      expect(SUPPORTED_LANGUAGES['en']).toBeDefined()
      expect(SUPPORTED_LANGUAGES['en'].name).toBe('English')
    })

    it('should have Hindi as a supported language', () => {
      expect(SUPPORTED_LANGUAGES['hi']).toBeDefined()
      expect(SUPPORTED_LANGUAGES['hi'].name).toBe('Hindi')
    })

    it('should have Sanskrit as a supported language', () => {
      expect(SUPPORTED_LANGUAGES['sa']).toBeDefined()
      expect(SUPPORTED_LANGUAGES['sa'].name).toBe('Sanskrit')
    })

    it('should have required properties for all languages', () => {
      Object.values(SUPPORTED_LANGUAGES).forEach((lang) => {
        expect(lang.code).toBeTruthy()
        expect(lang.name).toBeTruthy()
        expect(lang.nativeName).toBeTruthy()
        expect(lang.flag).toBeTruthy()
        expect(lang.direction).toBe('ltr')
      })
    })
  })

  describe('getAllChapters', () => {
    it('should return all chapter metadata', () => {
      const chapters = getAllChapters()
      expect(chapters).toEqual(GITA_CHAPTERS_META)
    })
  })

  describe('detectBrowserLanguage', () => {
    it('should return "en" as fallback when navigator is undefined', () => {
      const result = detectBrowserLanguage()
      expect(result).toBe('en')
    })
  })
})
