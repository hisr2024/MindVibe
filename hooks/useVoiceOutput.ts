/**
 * Hook for managing voice output (Text-to-Speech)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechSynthesisService } from '@/utils/speech/synthesis'
import { isSpeechSynthesisSupported } from '@/utils/speech/languageMapping'

export interface UseVoiceOutputOptions {
  language?: string
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export interface UseVoiceOutputReturn {
  isSpeaking: boolean
  isPaused: boolean
  isSupported: boolean
  error: string | null
  speak: (text: string) => void
  pause: () => void
  resume: () => void
  cancel: () => void
  updateRate: (rate: number) => void
}

export function useVoiceOutput(options: UseVoiceOutputOptions = {}): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => isSpeechSynthesisSupported())
  
  const synthesisRef = useRef<SpeechSynthesisService | null>(null)
  const isSpeakingRef = useRef(false)
  const {
    language = 'en',
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError,
  } = options

  // Stable refs for callbacks to prevent stale closures
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  const onErrorRef = useRef(onError)
  onStartRef.current = onStart
  onEndRef.current = onEnd
  onErrorRef.current = onError

  // Initialize synthesis service — only recreate on language change.
  // Rate/pitch/volume are updated in-place via updateConfig to avoid
  // destroying the service (and cancelling speech) on every slider drag.
  useEffect(() => {
    if (!isSupported) return

    synthesisRef.current = new SpeechSynthesisService({
      language,
      rate,
      pitch,
      volume,
    })

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.destroy()
        synthesisRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, language])

  // Update rate/pitch/volume without recreating the service
  useEffect(() => {
    if (synthesisRef.current) {
      synthesisRef.current.updateConfig({ rate, pitch, volume })
    }
  }, [rate, pitch, volume])

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current || !isSupported) {
      const errorMsg = 'Speech synthesis not supported in this browser'
      setError(errorMsg)
      onErrorRef.current?.(errorMsg)
      return
    }

    // Reset speaking state before cancel to prevent isSpeakingRef corruption
    // from rapid speakText() calls overlapping
    isSpeakingRef.current = false
    setError(null)

    synthesisRef.current.speak(text, {
      onStart: () => {
        isSpeakingRef.current = true
        setIsSpeaking(true)
        setIsPaused(false)
        onStartRef.current?.()
      },
      onEnd: () => {
        isSpeakingRef.current = false
        setIsSpeaking(false)
        setIsPaused(false)
        onEndRef.current?.()
      },
      onPause: () => {
        setIsPaused(true)
      },
      onResume: () => {
        setIsPaused(false)
      },
      onError: (err) => {
        isSpeakingRef.current = false
        setError(err)
        setIsSpeaking(false)
        setIsPaused(false)
        onErrorRef.current?.(err)
      },
    })
  }, [isSupported])

  const pause = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.pause()
      setIsPaused(true)
    }
  }, [])

  const resume = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.resume()
      setIsPaused(false)
    }
  }, [])

  const cancel = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }, [])

  const updateRate = useCallback((newRate: number) => {
    if (synthesisRef.current) {
      synthesisRef.current.updateConfig({ rate: newRate })
    }
  }, [])

  return {
    isSpeaking,
    isPaused,
    isSupported,
    error,
    speak,
    pause,
    resume,
    cancel,
    updateRate,
  }
}
