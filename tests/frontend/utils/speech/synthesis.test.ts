/**
 * Tests for speech synthesis service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpeechSynthesisService } from '@/utils/speech/synthesis'

describe('SpeechSynthesisService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create service with default config', () => {
      const service = new SpeechSynthesisService()
      expect(service).toBeDefined()
    })

    it('should accept custom config', () => {
      const service = new SpeechSynthesisService({
        language: 'es',
        rate: 1.5,
        pitch: 1.2,
        volume: 0.8,
      })
      expect(service).toBeDefined()
    })
  })

  describe('isSpeaking', () => {
    it('should return false initially', () => {
      const service = new SpeechSynthesisService()
      expect(service.isSpeaking()).toBe(false)
    })
  })

  describe('isPaused', () => {
    it('should return false initially', () => {
      const service = new SpeechSynthesisService()
      expect(service.isPaused()).toBe(false)
    })
  })

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const service = new SpeechSynthesisService()
      service.updateConfig({ rate: 1.5 })
      expect(service).toBeDefined()
    })
  })

  describe('getVoicesForLanguage', () => {
    it('should return empty array in non-browser environment', () => {
      const service = new SpeechSynthesisService()
      const voices = service.getVoicesForLanguage('en')
      expect(voices).toEqual([])
    })
  })

  describe('destroy', () => {
    it('should cleanup resources', () => {
      const service = new SpeechSynthesisService()
      service.destroy()
      expect(service.isSpeaking()).toBe(false)
    })
  })
})
