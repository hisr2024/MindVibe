/**
 * Hook for managing ultra-sensitive wake word detection
 *
 * Features:
 * - Configurable sensitivity levels (ultra/high/medium/low)
 * - Real-time listening state reporting
 * - Detection event details (confidence, match type, latency)
 * - Automatic lifecycle management
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  WakeWordDetector,
  WakeWordDetectionEvent,
  WakeWordListeningState,
  type WakeWordSensitivity,
} from '@/utils/speech/wakeWord'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'

export interface UseWakeWordOptions {
  language?: string
  enabled?: boolean
  wakeWords?: string[]
  sensitivity?: WakeWordSensitivity
  onWakeWordDetected?: (event: WakeWordDetectionEvent) => void
  onError?: (error: string) => void
  onStateChange?: (state: WakeWordListeningState) => void
}

export interface UseWakeWordReturn {
  isActive: boolean
  isSupported: boolean
  error: string | null
  sensitivity: WakeWordSensitivity
  listeningState: WakeWordListeningState | null
  lastDetection: WakeWordDetectionEvent | null
  start: () => void
  stop: () => void
  toggle: () => void
  setSensitivity: (level: WakeWordSensitivity) => void
}

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported] = useState(() => isSpeechRecognitionSupported())
  const [sensitivity, setSensitivityState] = useState<WakeWordSensitivity>(
    options.sensitivity || 'high'
  )
  const [listeningState, setListeningState] = useState<WakeWordListeningState | null>(null)
  const [lastDetection, setLastDetection] = useState<WakeWordDetectionEvent | null>(null)

  const detectorRef = useRef<WakeWordDetector | null>(null)
  const {
    language = 'en',
    enabled = false,
    wakeWords,
  } = options

  // Stable refs for callbacks to avoid re-creating the detector on every render
  const onWakeWordDetectedRef = useRef(options.onWakeWordDetected)
  const onErrorRef = useRef(options.onError)
  const onStateChangeRef = useRef(options.onStateChange)
  useEffect(() => {
    onWakeWordDetectedRef.current = options.onWakeWordDetected
    onErrorRef.current = options.onError
    onStateChangeRef.current = options.onStateChange
  }, [options.onWakeWordDetected, options.onError, options.onStateChange])

  // Stabilize wakeWords: only change reference when the actual values change.
  // This prevents the detector from being destroyed+recreated every render
  // when the parent passes an inline array literal like wakeWords={['kiaan']}.
  const wakeWordsKey = wakeWords ? wakeWords.join('\0') : ''
  const stableWakeWordsRef = useRef(wakeWords)
  useEffect(() => {
    stableWakeWordsRef.current = wakeWords
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeWordsKey])

  // Initialize wake word detector — only recreate when actual config values change
  useEffect(() => {
    if (!isSupported) return

    detectorRef.current = new WakeWordDetector({
      language,
      wakeWords: stableWakeWordsRef.current,
      sensitivity,
      onWakeWordDetected: (event: WakeWordDetectionEvent) => {
        setLastDetection(event)
        onWakeWordDetectedRef.current?.(event)
      },
      onError: (err: string) => {
        setError(err)
        if (err.includes('permission') || err.includes('not supported') || err.includes('not found')) {
          setIsActive(false)
        }
        onErrorRef.current?.(err)
      },
      onListeningStateChange: (state: WakeWordListeningState) => {
        setListeningState(state)
        setIsActive(state.isListening)
        onStateChangeRef.current?.(state)
      },
    })

    return () => {
      if (detectorRef.current) {
        detectorRef.current.destroy()
        detectorRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, language, wakeWordsKey, sensitivity])

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
      onErrorRef.current?.(errorMsg)
      return
    }

    setError(null)
    detectorRef.current.start()
    setIsActive(true)
  }, [isSupported])

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

  const setSensitivity = useCallback((level: WakeWordSensitivity) => {
    setSensitivityState(level)
    if (detectorRef.current) {
      detectorRef.current.setSensitivity(level)
    }
  }, [])

  // Auto-start when enabled, auto-stop when disabled
  useEffect(() => {
    const detector = detectorRef.current
    if (enabled && isSupported && detector && !isActive) {
      // Schedule outside synchronous effect to avoid cascading renders
      const id = requestAnimationFrame(() => { start() })
      return () => cancelAnimationFrame(id)
    } else if (!enabled && isActive) {
      const id = requestAnimationFrame(() => { stop() })
      return () => cancelAnimationFrame(id)
    }
  }, [enabled, isSupported, isActive, start, stop])

  return {
    isActive,
    isSupported,
    error,
    sensitivity,
    listeningState,
    lastDetection,
    start,
    stop,
    toggle,
    setSensitivity,
  }
}
