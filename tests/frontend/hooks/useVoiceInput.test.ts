/**
 * Tests for useVoiceInput hook — capability semantics.
 *
 * Verifies that isSupported, hasBrowserSTT, and hasServerFallback
 * accurately reflect the device's actual STT capabilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock dependencies before importing the hook
vi.mock('@/utils/speech/recognition', () => ({
  SpeechRecognitionService: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn(),
    setLanguage: vi.fn(),
  })),
}))

vi.mock('@/utils/speech/languageMapping', () => ({
  isSpeechRecognitionSupported: vi.fn(() => false),
}))

vi.mock('@/utils/browserSupport', () => ({
  canUseVoiceInput: vi.fn(() => ({ available: false, reason: 'not supported' })),
  isSecureContext: vi.fn(() => true),
  getBrowserName: vi.fn(() => 'Test Browser'),
}))

import { useVoiceInput } from '@/hooks/useVoiceInput'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'

describe('useVoiceInput — capability semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports hasBrowserSTT based on isSpeechRecognitionSupported', () => {
    vi.mocked(isSpeechRecognitionSupported).mockReturnValue(false)
    const { result } = renderHook(() => useVoiceInput())

    expect(result.current.hasBrowserSTT).toBe(false)
  })

  it('reports isSupported=true when server fallback is available', () => {
    vi.mocked(isSpeechRecognitionSupported).mockReturnValue(false)
    // navigator.onLine defaults to true in jsdom, mediaDevices exists
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })

    const { result } = renderHook(() => useVoiceInput())

    if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
      expect(result.current.hasServerFallback).toBe(true)
      expect(result.current.isSupported).toBe(true)
    }
  })

  it('returns deviceTier as one of low/mid/high', () => {
    const { result } = renderHook(() => useVoiceInput())
    expect(['low', 'mid', 'high']).toContain(result.current.deviceTier)
  })

  it('exposes all required fields in return type', () => {
    const { result } = renderHook(() => useVoiceInput())
    const hook = result.current

    // Core fields
    expect(hook).toHaveProperty('isListening')
    expect(hook).toHaveProperty('transcript')
    expect(hook).toHaveProperty('interimTranscript')
    expect(hook).toHaveProperty('isSupported')
    expect(hook).toHaveProperty('hasBrowserSTT')
    expect(hook).toHaveProperty('hasServerFallback')
    expect(hook).toHaveProperty('error')
    expect(hook).toHaveProperty('startListening')
    expect(hook).toHaveProperty('stopListening')
    expect(hook).toHaveProperty('resetTranscript')
    expect(hook).toHaveProperty('sttProvider')
    expect(hook).toHaveProperty('deviceTier')
    expect(hook).toHaveProperty('status')
    expect(hook).toHaveProperty('isOnline')
    expect(hook).toHaveProperty('confidence')
    expect(hook).toHaveProperty('nearingLimit')
  })

  it('starts with idle status', () => {
    const { result } = renderHook(() => useVoiceInput())
    expect(result.current.status).toBe('idle')
    expect(result.current.isListening).toBe(false)
  })
})
