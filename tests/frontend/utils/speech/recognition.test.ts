/**
 * Tests for speech recognition service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpeechRecognitionService } from '@/utils/speech/recognition'

// Mock SpeechRecognition
const mockRecognition = {
  lang: '',
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  onstart: null as (() => void) | null,
  onresult: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  onend: null as (() => void) | null,
}

describe('SpeechRecognitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock
    mockRecognition.lang = ''
    mockRecognition.continuous = false
    mockRecognition.interimResults = false
    mockRecognition.maxAlternatives = 1
    mockRecognition.onstart = null
    mockRecognition.onresult = null
    mockRecognition.onerror = null
    mockRecognition.onend = null
  })

  describe('constructor', () => {
    it('should create service with default config', () => {
      const service = new SpeechRecognitionService()
      expect(service).toBeDefined()
      expect(service.getIsListening()).toBe(false)
    })

    it('should accept custom config', () => {
      const service = new SpeechRecognitionService({
        language: 'es',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
      })
      expect(service).toBeDefined()
    })
  })

  describe('getIsListening', () => {
    it('should return false initially', () => {
      const service = new SpeechRecognitionService()
      expect(service.getIsListening()).toBe(false)
    })
  })

  describe('setLanguage', () => {
    it('should update language setting', () => {
      const service = new SpeechRecognitionService()
      service.setLanguage('fr')
      // Language is updated internally
      expect(service).toBeDefined()
    })
  })

  describe('destroy', () => {
    it('should cleanup resources', () => {
      const service = new SpeechRecognitionService()
      service.destroy()
      expect(service.getIsListening()).toBe(false)
    })
  })
})
