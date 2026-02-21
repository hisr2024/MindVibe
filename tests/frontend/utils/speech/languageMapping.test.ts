/**
 * Tests for speech language mapping utilities
 */

import { describe, it, expect } from 'vitest'
import {
  getSpeechLanguage,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  getSpeechRecognition,
  SPEECH_LANGUAGE_MAP,
} from '@/utils/speech/languageMapping'

describe('speech language mapping', () => {
  describe('SPEECH_LANGUAGE_MAP', () => {
    it('should have mappings for all supported locales', () => {
      const expectedLocales = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'sa', 'es', 'fr', 'de', 'pt', 'ja', 'zh-CN']

      expectedLocales.forEach(locale => {
        expect(SPEECH_LANGUAGE_MAP).toHaveProperty(locale)
        expect(typeof SPEECH_LANGUAGE_MAP[locale as keyof typeof SPEECH_LANGUAGE_MAP]).toBe('string')
      })
    })

    it('should map to correct BCP 47 language tags', () => {
      expect(SPEECH_LANGUAGE_MAP.en).toBe('en-US')
      expect(SPEECH_LANGUAGE_MAP.hi).toBe('hi-IN')
      expect(SPEECH_LANGUAGE_MAP.ta).toBe('ta-IN')
      expect(SPEECH_LANGUAGE_MAP.te).toBe('te-IN')
      expect(SPEECH_LANGUAGE_MAP.bn).toBe('bn-IN')
      expect(SPEECH_LANGUAGE_MAP.es).toBe('es-ES')
      expect(SPEECH_LANGUAGE_MAP.fr).toBe('fr-FR')
      expect(SPEECH_LANGUAGE_MAP.de).toBe('de-DE')
      expect(SPEECH_LANGUAGE_MAP['zh-CN']).toBe('zh-CN')
      expect(SPEECH_LANGUAGE_MAP.ja).toBe('ja-JP')
      expect(SPEECH_LANGUAGE_MAP.pt).toBe('pt-PT')
    })
  })

  describe('getSpeechLanguage', () => {
    it('should return correct language code for supported locales', () => {
      expect(getSpeechLanguage('en')).toBe('en-US')
      expect(getSpeechLanguage('es')).toBe('es-ES')
      expect(getSpeechLanguage('fr')).toBe('fr-FR')
    })

    it('should handle zh-CN special case', () => {
      expect(getSpeechLanguage('zh-CN')).toBe('zh-CN')
    })

    it('should fallback to en-US for unsupported locales', () => {
      expect(getSpeechLanguage('unknown')).toBe('en-US')
      expect(getSpeechLanguage('xyz')).toBe('en-US')
    })
  })

  describe('isSpeechRecognitionSupported', () => {
    it('should return false in non-browser environment', () => {
      expect(isSpeechRecognitionSupported()).toBe(false)
    })
  })

  describe('isSpeechSynthesisSupported', () => {
    it('should return false in non-browser environment', () => {
      expect(isSpeechSynthesisSupported()).toBe(false)
    })
  })

  describe('getSpeechRecognition', () => {
    it('should return null in non-browser environment', () => {
      expect(getSpeechRecognition()).toBe(null)
    })
  })
})
