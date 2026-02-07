/**
 * useEnhancedVoiceOutput - Enhanced TTS hook with backend and browser support
 *
 * Features:
 * - Tries backend TTS first (higher quality neural voices)
 * - Falls back to browser Speech Synthesis if backend fails
 * - Audio caching for repeated playback
 * - Play/Pause/Stop controls
 * - Multi-language support
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechSynthesisService, type VoiceGender } from '@/utils/speech/synthesis'
import { isSpeechSynthesisSupported } from '@/utils/speech/languageMapping'

export interface UseEnhancedVoiceOutputOptions {
  language?: string
  rate?: number
  voiceType?: 'friendly' | 'calm' | 'wisdom'
  /** Preferred voice gender: female, male, or auto */
  voiceGender?: VoiceGender
  useBackendTts?: boolean  // Try backend TTS first
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

// Module-level circuit breaker with timed recovery (resets after 5 min)
let backendTtsDisabled = false
let backendTtsDisabledUntil = 0
const BACKEND_TTS_COOLDOWN = 5 * 60 * 1000

function isBackendTtsAvailable(): boolean {
  if (!backendTtsDisabled) return true
  if (Date.now() >= backendTtsDisabledUntil) {
    backendTtsDisabled = false
    return true
  }
  return false
}

export interface UseEnhancedVoiceOutputReturn {
  isSpeaking: boolean
  isPaused: boolean
  isLoading: boolean
  isSupported: boolean
  error: string | null
  speak: (text: string) => Promise<void>
  pause: () => void
  resume: () => void
  cancel: () => void
  updateRate: (rate: number) => void
  updateGender: (gender: VoiceGender) => void
}

export function useEnhancedVoiceOutput(
  options: UseEnhancedVoiceOutputOptions = {}
): UseEnhancedVoiceOutputReturn {
  const {
    language = 'en',
    rate = 0.95,
    voiceType = 'friendly',
    voiceGender = 'auto',
    useBackendTts = true,
    onStart,
    onEnd,
    onError,
  } = options

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => isSpeechSynthesisSupported())

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const synthesisRef = useRef<SpeechSynthesisService | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const rateRef = useRef(rate)

  // Initialize browser synthesis as fallback
  useEffect(() => {
    if (!isSupported) return

    synthesisRef.current = new SpeechSynthesisService({
      language,
      rate,
      pitch: 1.0,
      volume: 1.0,
      gender: voiceGender,
    })

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.destroy()
        synthesisRef.current = null
      }
    }
  }, [isSupported, language, rate, voiceGender])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current)
        currentUrlRef.current = null
      }
    }
  }, [])

  // Try backend TTS
  const tryBackendTts = useCallback(async (text: string): Promise<boolean> => {
    if (!useBackendTts || !isBackendTtsAvailable()) return false

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          text,
          language,
          voice_type: voiceType,
          speed: rateRef.current,
        }),
      })

      clearTimeout(timeout)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          backendTtsDisabled = true
          backendTtsDisabledUntil = Date.now() + BACKEND_TTS_COOLDOWN
        }
        return false
      }

      const contentType = response.headers.get('content-type')

      // Check if we got audio back
      if (contentType?.includes('audio')) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Revoke previous URL
        if (currentUrlRef.current) {
          URL.revokeObjectURL(currentUrlRef.current)
        }
        currentUrlRef.current = audioUrl

        // Play audio
        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.playbackRate = rateRef.current

        audio.onplay = () => {
          setIsSpeaking(true)
          setIsPaused(false)
          setIsLoading(false)
          onStart?.()
        }

        audio.onended = () => {
          setIsSpeaking(false)
          setIsPaused(false)
          onEnd?.()
        }

        audio.onerror = () => {
          setError('Audio playback failed')
          setIsSpeaking(false)
          setIsPaused(false)
          setIsLoading(false)
        }

        try {
          await audio.play()
        } catch {
          // Autoplay blocked or audio element error — fall through to browser TTS
          setIsSpeaking(false)
          setIsLoading(false)
          return false
        }
        return true
      }

      // Backend returned fallback indicator
      const data = await response.json()
      if (data.fallback) {
        return false
      }

      return false
    } catch {
      clearTimeout(timeout)
      return false // Timeout or network error - fall back to browser TTS
    }
  }, [language, voiceType, useBackendTts, onStart, onEnd])

  // Use browser synthesis as fallback
  const useBrowserSynthesis = useCallback((text: string) => {
    if (!synthesisRef.current || !isSupported) {
      const errorMsg = 'Speech synthesis not supported'
      setError(errorMsg)
      setIsLoading(false)
      onError?.(errorMsg)
      return
    }

    synthesisRef.current.speak(text, {
      onStart: () => {
        setIsSpeaking(true)
        setIsPaused(false)
        setIsLoading(false)
        onStart?.()
      },
      onEnd: () => {
        setIsSpeaking(false)
        setIsPaused(false)
        onEnd?.()
      },
      onPause: () => {
        setIsPaused(true)
      },
      onResume: () => {
        setIsPaused(false)
      },
      onError: (err) => {
        setError(err)
        setIsSpeaking(false)
        setIsPaused(false)
        setIsLoading(false)
        onError?.(err)
      },
    })
  }, [isSupported, onStart, onEnd, onError])

  // Main speak function
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    setError(null)
    setIsLoading(true)

    // Cancel any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }

    // Try backend TTS first
    const backendSuccess = await tryBackendTts(text)

    if (!backendSuccess) {
      // Fall back to browser synthesis
      useBrowserSynthesis(text)
    }
  }, [tryBackendTts, useBrowserSynthesis])

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause()
      setIsPaused(true)
    } else if (synthesisRef.current) {
      synthesisRef.current.pause()
    }
  }, [isSpeaking])

  // Resume
  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play()
      setIsPaused(false)
    } else if (synthesisRef.current) {
      synthesisRef.current.resume()
    }
  }, [isPaused])

  // Cancel - properly release audio resources to prevent memory leaks
  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current = null
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
    setIsSpeaking(false)
    setIsPaused(false)
    setIsLoading(false)
  }, [])

  // Update rate
  const updateRate = useCallback((newRate: number) => {
    rateRef.current = newRate
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
    if (synthesisRef.current) {
      synthesisRef.current.updateConfig({ rate: newRate })
    }
  }, [])

  // Update voice gender preference
  const updateGender = useCallback((gender: VoiceGender) => {
    if (synthesisRef.current) {
      synthesisRef.current.setGender(gender)
    }
  }, [])

  return {
    isSpeaking,
    isPaused,
    isLoading,
    isSupported,
    error,
    speak,
    pause,
    resume,
    cancel,
    updateRate,
    updateGender,
  }
}
