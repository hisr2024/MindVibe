/**
 * Global Wake Word Context for KIAAN Voice Companion
 *
 * Provides app-wide wake word detection that works on every page.
 * When the user says "Hey KIAAN", "Namaste KIAAN", "Hi KIAAN", "Hello KIAAN",
 * or any configured wake phrase, KIAAN activates from anywhere in the app.
 *
 * Features:
 * - Always-on listening across all pages (like Siri/Alexa)
 * - Persistent enable/disable toggle stored in localStorage
 * - Sensitivity configuration
 * - Automatic pause during active KIAAN voice sessions
 * - Graceful degradation when Speech API unavailable
 */

'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  WakeWordDetector,
  type WakeWordDetectionEvent,
  type WakeWordListeningState,
  type WakeWordSensitivity,
} from '@/utils/speech/wakeWord'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'

// ─── Storage Keys ──────────────────────────────────────────────────────
const STORAGE_KEY_ENABLED = 'mindvibe_wake_word_enabled'
const STORAGE_KEY_SENSITIVITY = 'mindvibe_wake_word_sensitivity'

// ─── Context Types ─────────────────────────────────────────────────────

export interface WakeWordContextState {
  /** Whether wake word detection is enabled by the user */
  enabled: boolean
  /** Whether the browser supports speech recognition */
  isSupported: boolean
  /** Whether the detector is actively listening right now */
  isListening: boolean
  /** Whether KIAAN was just activated by wake word */
  isActivated: boolean
  /** Current sensitivity level */
  sensitivity: WakeWordSensitivity
  /** Last detection event details */
  lastDetection: WakeWordDetectionEvent | null
  /** Listening state details */
  listeningState: WakeWordListeningState | null
  /** Any error from the wake word system */
  error: string | null
  /** Whether detection is temporarily paused (e.g., during voice session) */
  isPaused: boolean
}

export interface WakeWordContextActions {
  /** Toggle wake word on/off - persists to localStorage */
  setEnabled: (enabled: boolean) => void
  /** Change sensitivity level - persists to localStorage */
  setSensitivity: (level: WakeWordSensitivity) => void
  /** Temporarily pause detection (e.g., during KIAAN voice conversation) */
  pause: () => void
  /** Resume detection after pause */
  resume: () => void
  /** Dismiss the activation overlay */
  dismissActivation: () => void
  /** Manually trigger activation (for testing or programmatic use) */
  triggerActivation: () => void
}

export type WakeWordContextValue = WakeWordContextState & WakeWordContextActions

const WakeWordContext = createContext<WakeWordContextValue | null>(null)

// ─── Provider ──────────────────────────────────────────────────────────

interface WakeWordProviderProps {
  children: ReactNode
}

export function WakeWordProvider({ children }: WakeWordProviderProps) {
  // Core state
  const [enabled, setEnabledState] = useState(false)
  const [sensitivity, setSensitivityState] = useState<WakeWordSensitivity>('high')
  const [isListening, setIsListening] = useState(false)
  const [isActivated, setIsActivated] = useState(false)
  const [lastDetection, setLastDetection] = useState<WakeWordDetectionEvent | null>(null)
  const [listeningState, setListeningState] = useState<WakeWordListeningState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return isSpeechRecognitionSupported()
  })

  // Refs
  const detectorRef = useRef<WakeWordDetector | null>(null)
  const isPausedRef = useRef(false)

  // Keep ref in sync
  isPausedRef.current = isPaused

  // ─── Load persisted settings from localStorage ───────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const storedEnabled = localStorage.getItem(STORAGE_KEY_ENABLED)
      if (storedEnabled !== null) {
        setEnabledState(storedEnabled === 'true')
      }

      const storedSensitivity = localStorage.getItem(STORAGE_KEY_SENSITIVITY)
      if (storedSensitivity && ['ultra', 'high', 'medium', 'low'].includes(storedSensitivity)) {
        setSensitivityState(storedSensitivity as WakeWordSensitivity)
      }
    } catch {
      // localStorage may be unavailable in some contexts
    }
  }, [])

  // ─── Initialize / Destroy Detector ───────────────────────────────
  useEffect(() => {
    if (!isSupported || typeof window === 'undefined') return

    detectorRef.current = new WakeWordDetector({
      sensitivity,
      onWakeWordDetected: (event: WakeWordDetectionEvent) => {
        // Ignore detections while paused
        if (isPausedRef.current) return

        setLastDetection(event)
        setIsActivated(true)
      },
      onError: (err: string) => {
        // Only surface permission/fatal errors to the user
        if (err.includes('permission') || err.includes('not supported') || err.includes('stopped after')) {
          setError(err)
        }
      },
      onListeningStateChange: (state: WakeWordListeningState) => {
        setListeningState(state)
        setIsListening(state.isListening)
      },
    })

    return () => {
      if (detectorRef.current) {
        detectorRef.current.destroy()
        detectorRef.current = null
      }
    }
  }, [isSupported, sensitivity])

  // ─── Start/Stop based on enabled + paused state ──────────────────
  useEffect(() => {
    if (!detectorRef.current || !isSupported) return

    const shouldListen = enabled && !isPaused

    if (shouldListen && !detectorRef.current.getIsActive()) {
      setError(null)
      detectorRef.current.start()
    } else if (!shouldListen && detectorRef.current.getIsActive()) {
      detectorRef.current.stop()
    }
  }, [enabled, isPaused, isSupported])

  // ─── Actions ─────────────────────────────────────────────────────

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    setError(null)
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, String(value))
    } catch {
      // localStorage unavailable
    }
  }, [])

  const setSensitivity = useCallback((level: WakeWordSensitivity) => {
    setSensitivityState(level)
    if (detectorRef.current) {
      detectorRef.current.setSensitivity(level)
    }
    try {
      localStorage.setItem(STORAGE_KEY_SENSITIVITY, level)
    } catch {
      // localStorage unavailable
    }
  }, [])

  const pause = useCallback(() => {
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  const dismissActivation = useCallback(() => {
    setIsActivated(false)
  }, [])

  const triggerActivation = useCallback(() => {
    setIsActivated(true)
    setLastDetection({
      wakeWord: 'manual',
      confidence: 1.0,
      matchType: 'exact',
      detectionLatencyMs: 0,
      transcript: 'manual activation',
      timestamp: Date.now(),
    })
  }, [])

  // ─── Context Value ───────────────────────────────────────────────

  const value: WakeWordContextValue = {
    // State
    enabled,
    isSupported,
    isListening,
    isActivated,
    sensitivity,
    lastDetection,
    listeningState,
    error,
    isPaused,
    // Actions
    setEnabled,
    setSensitivity,
    pause,
    resume,
    dismissActivation,
    triggerActivation,
  }

  return (
    <WakeWordContext.Provider value={value}>
      {children}
    </WakeWordContext.Provider>
  )
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useGlobalWakeWord(): WakeWordContextValue {
  const context = useContext(WakeWordContext)
  if (!context) {
    throw new Error('useGlobalWakeWord must be used within a WakeWordProvider')
  }
  return context
}
