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
import { apiFetch } from '@/lib/api'

export interface UseEnhancedVoiceOutputOptions {
  language?: string
  rate?: number
  voiceType?: 'friendly' | 'calm' | 'wisdom'
  /** Preferred voice gender: female, male, or auto */
  voiceGender?: VoiceGender
  /** Specific voice ID for provider routing (e.g. 'sarvam-aura', 'edge-female') */
  voiceId?: string
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

export type TtsMode = 'premium' | 'browser' | 'failed'

export interface UseEnhancedVoiceOutputReturn {
  isSpeaking: boolean
  isPaused: boolean
  isLoading: boolean
  isSupported: boolean
  error: string | null
  /** Current TTS tier: 'premium' (backend), 'browser' (degraded fallback), 'failed' */
  ttsMode: TtsMode
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
    voiceId,
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
  // P1-20: Circuit-breaker observability — surface degraded mode to UI
  const [ttsMode, setTtsMode] = useState<TtsMode>(() =>
    useBackendTts ? 'premium' : 'browser'
  )

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const synthesisRef = useRef<SpeechSynthesisService | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const rateRef = useRef(rate)
  const mountedRef = useRef(true)

  // Stable callback refs — avoids stale closures in async audio event handlers
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  const onErrorRef = useRef(onError)
  // Exactly-once guard: prevents double onEnd calls (e.g. cancel() + browser onended)
  const endFiredRef = useRef(false)

  useEffect(() => {
    onStartRef.current = onStart
    onEndRef.current = onEnd
    onErrorRef.current = onError
  })

  /** Signal parent that TTS is done — guaranteed exactly once per speak() call */
  const fireOnEnd = useCallback(() => {
    if (!endFiredRef.current) {
      endFiredRef.current = true
      onEndRef.current?.()
    }
  }, [])

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
      mountedRef.current = false
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
      const response = await apiFetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text,
          language,
          voice_type: voiceType,
          voice_id: voiceId,
          speed: rateRef.current,
        }),
      })

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
          if (!mountedRef.current) return
          setIsSpeaking(true)
          setIsPaused(false)
          setIsLoading(false)
          setTtsMode('premium')
          onStartRef.current?.()
        }

        // P0-2: Release blob URL + null handlers BEFORE fireOnEnd to prevent
        // bounded leak per response (~100-500KB each). On low-memory mobile
        // devices, ~10 unreleased blobs cause next speak() to silently fail.
        const releaseAudioResources = () => {
          audio.onplay = null
          audio.onpause = null
          audio.onended = null
          audio.onerror = null
          try { audio.removeAttribute('src') } catch {}
          try { audio.load() } catch {}
          if (currentUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl)
            currentUrlRef.current = null
          } else {
            // Defensive: revoke the local URL even if the ref was rotated
            try { URL.revokeObjectURL(audioUrl) } catch {}
          }
          if (audioRef.current === audio) {
            audioRef.current = null
          }
        }

        audio.onended = () => {
          // Clean up audio pipeline first, then notify listeners
          releaseAudioResources()
          if (!mountedRef.current) return
          setIsSpeaking(false)
          setIsPaused(false)
          fireOnEnd()
        }

        audio.onerror = () => {
          releaseAudioResources()
          if (!mountedRef.current) return
          setError('Audio playback failed')
          setIsSpeaking(false)
          setIsPaused(false)
          setIsLoading(false)
          fireOnEnd()
        }

        try {
          await audio.play()
        } catch {
          // Autoplay blocked — clean up dangling handlers + blob URL
          releaseAudioResources()
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
      return false // Timeout or network error - fall back to browser TTS
    } finally {
      clearTimeout(timeout)
    }
  }, [language, voiceType, voiceId, useBackendTts, fireOnEnd])

  // Use browser synthesis as fallback
  const playBrowserSynthesis = useCallback((text: string) => {
    if (!synthesisRef.current || !isSupported) {
      const errorMsg = 'Speech synthesis not supported'
      setError(errorMsg)
      setIsLoading(false)
      setTtsMode('failed')
      onErrorRef.current?.(errorMsg)
      fireOnEnd()
      return
    }

    // P1-20: Signal degraded tier so UI can show a subtle indicator
    setTtsMode('browser')

    synthesisRef.current.speak(text, {
      onStart: () => {
        setIsSpeaking(true)
        setIsPaused(false)
        setIsLoading(false)
        onStartRef.current?.()
      },
      onEnd: () => {
        setIsSpeaking(false)
        setIsPaused(false)
        fireOnEnd()
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
        onErrorRef.current?.(err)
        fireOnEnd()
      },
    })
  }, [isSupported, fireOnEnd])

  // Main speak function
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    setError(null)
    setIsLoading(true)
    endFiredRef.current = false
    // Reset tier optimistically — will be downgraded only if backend fails
    if (useBackendTts && isBackendTtsAvailable()) setTtsMode('premium')

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
      playBrowserSynthesis(text)
    }
  }, [tryBackendTts, playBrowserSynthesis, useBackendTts])

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
      audioRef.current.play().catch(() => {
        // Autoplay blocked — fall through silently
      })
      setIsPaused(false)
    } else if (synthesisRef.current) {
      synthesisRef.current.resume()
    }
  }, [isPaused])

  // Cancel - properly release audio resources to prevent memory leaks
  const cancel = useCallback(() => {
    // Null out event handlers BEFORE pausing to prevent stale onended firing
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onerror = null
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
    fireOnEnd()
  }, [fireOnEnd])

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
    ttsMode,
    speak,
    pause,
    resume,
    cancel,
    updateRate,
    updateGender,
  }
}
