/**
 * useWakeWord — Wake Word Detection Hook
 *
 * Listens for "Hey KIAAN" (and variants) using Web Speech API in continuous
 * mode. When a wake phrase is detected, fires a callback so the app can
 * hand off to the main STT pipeline for user input.
 *
 * CRITICAL CONSTRAINT: The browser can only have ONE active SpeechRecognition
 * instance at a time. This hook STOPS its own recognition before firing the
 * callback, and exposes resumeListening() for the caller to restart wake
 * word detection after the main interaction completes.
 *
 * Features:
 *   - Exact and fuzzy wake phrase matching
 *   - 1.5s debounce to prevent rapid-fire detections
 *   - Clean lifecycle (start / stop / resume / destroy)
 *   - SSR-safe with full unmount cleanup
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseWakeWordOptions {
  onWakeWordDetected?: (phrase: string) => void
  language?: string
}

interface UseWakeWordReturn {
  isListening: boolean
  startWakeWordListening: () => void
  stopWakeWordListening: () => void
  resumeListening: () => void
  wakeWordSupported: boolean
  lastDetected: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Primary wake phrases (exact match, case-insensitive) */
const WAKE_PHRASES = ['hey kiaan', 'hi kiaan', 'namaste kiaan', 'ok kiaan'] as const

/**
 * Fuzzy variants that speech recognition engines commonly produce
 * when the user says "Hey KIAAN" (misheard phonetics).
 */
const FUZZY_PHRASES = ['key on', 'he ki on', 'hey ki', 'kiaan'] as const

/** All phrases combined for matching */
const ALL_PHRASES: readonly string[] = [...WAKE_PHRASES, ...FUZZY_PHRASES]

/** Debounce interval to prevent rapid-fire wake word detections */
const DEBOUNCE_MS = 1500

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if the transcript contains any of the wake phrases.
 * Returns the matched phrase or null.
 */
function findWakePhrase(transcript: string): string | null {
  const normalized = transcript.toLowerCase().trim()

  for (const phrase of ALL_PHRASES) {
    if (normalized.includes(phrase)) {
      return phrase
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Stop phrase detection (Alexa/Siri-style session termination)
// ---------------------------------------------------------------------------

/** Phrases that end the active KIAAN voice session. */
const STOP_PHRASES = [
  'stop kiaan',    'stop listening',  'stop',
  'goodbye kiaan', 'good bye',        'goodbye',
  'bye bye',       'bye kiaan',       'bye',
  'thanks kiaan',  'thank you kiaan',
  "that's all",    'that is all',
  'end session',   'exit kiaan',      'cancel kiaan',
] as const

/**
 * Returns the matched stop phrase, or null. Word-boundary regex prevents
 * "stopwatch", "maybe later", "goodbyes are hard" false positives.
 * Sorted longest-first so "goodbye kiaan" wins over "goodbye" wins over "bye".
 */
export function findStopPhrase(transcript: string): string | null {
  const normalized = transcript.toLowerCase().trim()
  if (!normalized) return null
  const sorted = [...STOP_PHRASES].sort((a, b) => b.length - a.length)
  for (const phrase of sorted) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(^|\\b)${escaped}(\\b|$)`, 'i')
    if (re.test(normalized)) return phrase
  }
  return null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const { onWakeWordDetected, language = 'en' } = options

  const [isListening, setIsListening] = useState(false)
  const [wakeWordSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return isSpeechRecognitionSupported()
  })
  const [lastDetected, setLastDetected] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const lastDetectionTimeRef = useRef(0)
  const isListeningRef = useRef(false)
  // Track restart + resume setTimeout handles so unmount cleanup can cancel
  // them explicitly. Without this, pending restarts can queue up during rapid
  // route changes or recognition restart loops and fire post-unmount.
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable callback ref
  const onWakeWordDetectedRef = useRef(onWakeWordDetected)
  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected
  })

  // ---------------------------------------------------------------------------
  // Create a DEDICATED SpeechRecognitionService instance for wake word detection.
  // This is separate from the main STT instance used by useVoiceInput.
  // ---------------------------------------------------------------------------
  const createRecognition = useCallback(() => {
    // SSR guard
    if (typeof window === 'undefined') return null
    if (!isSpeechRecognitionSupported()) return null

    return new SpeechRecognitionService({
      language,
      continuous: true,
      interimResults: true,
    })
  }, [language])

  // ---------------------------------------------------------------------------
  // Handle speech results — check for wake phrase in every interim/final result
  // ---------------------------------------------------------------------------
  const handleResult = useCallback((transcript: string, _isFinal: boolean) => {
    if (!mountedRef.current || !isListeningRef.current) return

    const matched = findWakePhrase(transcript)
    if (!matched) return

    // Debounce: ignore if detected too recently
    const now = Date.now()
    if (now - lastDetectionTimeRef.current < DEBOUNCE_MS) return
    lastDetectionTimeRef.current = now

    if (!mountedRef.current) return
    setLastDetected(matched)

    // CRITICAL: Stop wake word recognition BEFORE handing off to main STT.
    // The browser can only have one SpeechRecognition active at a time.
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    isListeningRef.current = false
    setIsListening(false)

    // Fire callback after stopping recognition
    onWakeWordDetectedRef.current?.(matched)
  }, [])

  // ---------------------------------------------------------------------------
  // Start wake word listening
  // ---------------------------------------------------------------------------
  const startWakeWordListening = useCallback(() => {
    // SSR guard
    if (typeof window === 'undefined') return
    if (!wakeWordSupported) return
    if (isListeningRef.current) return

    // Destroy any stale instance and create fresh
    if (recognitionRef.current) {
      recognitionRef.current.destroy()
    }

    const recognition = createRecognition()
    if (!recognition) return
    recognitionRef.current = recognition

    isListeningRef.current = true
    if (mountedRef.current) setIsListening(true)

    // Stable callback set reused across restarts so wake word detection
    // keeps recovering every time the Web Speech API ends on its own.
    const wakeWordCallbacks = {
      onStart: () => {
        if (mountedRef.current) setIsListening(true)
      },

      onResult: (transcript: string, isFinal: boolean) => {
        handleResult(transcript, isFinal)
      },

      onEnd: () => {
        if (!mountedRef.current) return

        // If we're still supposed to be listening (wasn't stopped intentionally),
        // restart recognition. Web Speech API can end on its own after silence.
        if (isListeningRef.current) {
          // Belt-and-braces: do not restart the mic if the KIAAN Vibe Player
          // is actively playing audio. The footer effect is the primary gate,
          // but this prevents a pending restart from re-arming the mic in the
          // small window between onEnd firing and the footer effect re-running.
          if (usePlayerStore.getState().isPlaying) {
            isListeningRef.current = false
            setIsListening(false)
            return
          }

          // Small delay before restart to avoid rapid restart loops.
          // Track the timer handle so unmount cleanup can cancel it.
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null
            if (!mountedRef.current || !isListeningRef.current) return
            if (!recognitionRef.current) return

            // Re-check at timer fire — playback may have started during the delay
            if (usePlayerStore.getState().isPlaying) {
              isListeningRef.current = false
              setIsListening(false)
              return
            }

            // Reuse the same callbacks so onEnd keeps restarting indefinitely
            recognitionRef.current.start(wakeWordCallbacks)
          }, 500)
        } else {
          setIsListening(false)
        }
      },

      onError: () => {
        // Silent failure — wake word detection is best-effort.
        // The main app remains fully functional without it.
      },
    }

    recognition.start(wakeWordCallbacks)
  }, [wakeWordSupported, createRecognition, handleResult])

  // ---------------------------------------------------------------------------
  // Stop wake word listening
  // ---------------------------------------------------------------------------
  const stopWakeWordListening = useCallback(() => {
    isListeningRef.current = false
    // Cancel any pending restart/resume so we don't re-arm after an explicit stop
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null }
    if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (mountedRef.current) {
      setIsListening(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Resume listening — called after main interaction completes
  // ---------------------------------------------------------------------------
  const resumeListening = useCallback(() => {
    if (!mountedRef.current) return
    if (!wakeWordSupported) return

    // Small delay to ensure main STT has fully released the recognition slot.
    // Track the handle so unmount/stop can cancel it.
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null
      if (!mountedRef.current) return
      startWakeWordListening()
    }, 300)
  }, [wakeWordSupported, startWakeWordListening])

  // ---------------------------------------------------------------------------
  // Cleanup on unmount — destroy recognition instance + cancel pending timers
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      mountedRef.current = false
      isListeningRef.current = false
      if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null }
      if (resumeTimerRef.current) { clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isListening,
    startWakeWordListening,
    stopWakeWordListening,
    resumeListening,
    wakeWordSupported,
    lastDetected,
  }
}

export type { UseWakeWordOptions, UseWakeWordReturn }
