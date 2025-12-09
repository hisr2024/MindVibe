/**
 * Hook for managing wake word detection
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { WakeWordDetector } from '@/utils/speech/wakeWord'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'

export interface UseWakeWordOptions {
  language?: string
  enabled?: boolean
  wakeWords?: string[]
  onWakeWordDetected?: () => void
  onError?: (error: string) => void
}

export interface UseWakeWordReturn {
  isActive: boolean
  isSupported: boolean
  error: string | null
  start: () => void
  stop: () => void
  toggle: () => void
}

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => isSpeechRecognitionSupported())
  
  const detectorRef = useRef<WakeWordDetector | null>(null)
  const {
    language = 'en',
    enabled = false,
    wakeWords,
    onWakeWordDetected,
    onError,
  } = options

  // Initialize wake word detector
  useEffect(() => {
    if (!isSupported) return

    detectorRef.current = new WakeWordDetector({
      language,
      wakeWords,
      onWakeWordDetected: () => {
        onWakeWordDetected?.()
      },
      onError: (err) => {
        setError(err)
        setIsActive(false)
        onError?.(err)
      },
    })

    return () => {
      if (detectorRef.current) {
        detectorRef.current.destroy()
        detectorRef.current = null
      }
    }
  }, [isSupported, language, wakeWords, onWakeWordDetected, onError])

  // Update language when it changes
  useEffect(() => {
    if (detectorRef.current) {
      detectorRef.current.setLanguage(language)
    }
  }, [language])

  const start = useCallback(() => {
    if (!detectorRef.current || !isSupported) {
      const errorMsg = 'Wake word detection not supported in this browser'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setError(null)
    detectorRef.current.start()
    setIsActive(true)
  }, [isSupported, onError])

  const stop = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop()
    }
    setIsActive(false)
  }, [])

  const toggle = useCallback(() => {
    if (isActive) {
      stop()
    } else {
      start()
    }
  }, [isActive, start, stop])

  // Auto-start if enabled on mount - moved after callback definitions
  useEffect(() => {
    if (enabled && isSupported && detectorRef.current && !isActive) {
      start()
    }
  }, [enabled, isSupported, isActive, start])

  return {
    isActive,
    isSupported,
    error,
    start,
    stop,
    toggle,
  }
}
