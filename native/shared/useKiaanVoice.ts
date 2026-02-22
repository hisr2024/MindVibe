/**
 * KIAAN Voice React Native Hook
 *
 * Cross-platform voice AI hook using native iOS/Android managers
 *
 * Usage:
 * ```tsx
 * const {
 *   state,
 *   transcript,
 *   isListening,
 *   isSpeaking,
 *   error,
 *   activate,
 *   stopListening,
 *   enableWakeWord,
 *   speak,
 * } = useKiaanVoice({
 *   language: 'en-US',
 *   enableWakeWord: true,
 *   onTranscript: (text, isFinal) => {
 *     if (isFinal) handleQuery(text)
 *   },
 * })
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { NativeModules, NativeEventEmitter } from 'react-native'
import type {
  KiaanVoiceState,
  KiaanVoiceConfig,
  KiaanVoiceError,
  KiaanVoiceEvents,
  KiaanVoiceNativeModule,
  KiaanVoiceMetrics,
} from './KiaanVoiceInterface'
import { KIAAN_VOICE_EVENTS, DEFAULT_CONFIG } from './KiaanVoiceInterface'

// ============================================================================
// Native Module Access
// ============================================================================

const { KiaanVoiceModule } = NativeModules as {
  KiaanVoiceModule: KiaanVoiceNativeModule
}

const eventEmitter = new NativeEventEmitter(KiaanVoiceModule as unknown as Parameters<typeof NativeEventEmitter>[0])

// ============================================================================
// Hook Options
// ============================================================================

export interface UseKiaanVoiceOptions extends Partial<KiaanVoiceConfig>, Partial<KiaanVoiceEvents> {
  /** Auto-initialize on mount (default: true) */
  autoInitialize?: boolean
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseKiaanVoiceReturn {
  // State
  state: KiaanVoiceState
  transcript: string
  interimTranscript: string
  isListening: boolean
  isSpeaking: boolean
  isReady: boolean
  hasPermission: boolean
  error: KiaanVoiceError | null

  // Actions
  initialize: () => Promise<void>
  requestPermissions: () => Promise<boolean>
  activate: () => Promise<void>
  stopListening: () => Promise<void>
  enableWakeWord: () => Promise<void>
  disableWakeWord: () => Promise<void>
  speak: (text: string) => Promise<void>
  stopSpeaking: () => Promise<void>
  reset: () => Promise<void>

  // Metrics
  metrics: KiaanVoiceMetrics | null
}

// ============================================================================
// Main Hook
// ============================================================================

export function useKiaanVoice(options: UseKiaanVoiceOptions = {}): UseKiaanVoiceReturn {
  const {
    autoInitialize = true,
    onStateChange,
    onTranscript,
    onWakeWordDetected,
    onError,
    onReady,
    onSpeakingStart,
    onSpeakingEnd,
    ...config
  } = options

  // State
  const [state, setState] = useState<KiaanVoiceState>('uninitialized')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<KiaanVoiceError | null>(null)
  const [metrics, setMetrics] = useState<KiaanVoiceMetrics | null>(null)

  // Refs for callbacks (avoid stale closures)
  const callbacksRef = useRef({
    onStateChange,
    onTranscript,
    onWakeWordDetected,
    onError,
    onReady,
    onSpeakingStart,
    onSpeakingEnd,
  })

  // Update callbacks ref
  useEffect(() => {
    callbacksRef.current = {
      onStateChange,
      onTranscript,
      onWakeWordDetected,
      onError,
      onReady,
      onSpeakingStart,
      onSpeakingEnd,
    }
  }, [onStateChange, onTranscript, onWakeWordDetected, onError, onReady, onSpeakingStart, onSpeakingEnd])

  // Metrics tracking
  const metricsRef = useRef({
    activationTime: 0,
    speechEndTime: 0,
    retryCount: 0,
  })

  // ========================================================================
  // Event Listeners
  // ========================================================================

  useEffect(() => {
    const subscriptions = [
      eventEmitter.addListener(
        KIAAN_VOICE_EVENTS.STATE_CHANGE,
        (event: { state: KiaanVoiceState; previousState: KiaanVoiceState }) => {
          setState(event.state)

          // Update derived state
          setIsListening(event.state === 'listening')
          setIsSpeaking(event.state === 'speaking')
          setIsReady(['idle', 'wakeWordListening'].includes(event.state))

          // Track metrics
          if (event.state === 'listening') {
            metricsRef.current.activationTime = Date.now()
          }

          callbacksRef.current.onStateChange?.(event.state, event.previousState)
        }
      ),

      eventEmitter.addListener(
        KIAAN_VOICE_EVENTS.TRANSCRIPT,
        (event: { transcript: string; isFinal: boolean }) => {
          if (event.isFinal) {
            setTranscript(event.transcript)
            setInterimTranscript('')

            // Calculate metrics
            const now = Date.now()
            const activationLatency = now - metricsRef.current.activationTime

            setMetrics({
              activationLatency,
              recognitionLatency: 0, // Would need native timing
              usedOnDeviceRecognition: config.useOnDeviceRecognition ?? true,
              audioDuration: activationLatency,
              retryCount: metricsRef.current.retryCount,
            })
          } else {
            setInterimTranscript(event.transcript)
          }

          callbacksRef.current.onTranscript?.(event.transcript, event.isFinal)
        }
      ),

      eventEmitter.addListener(
        KIAAN_VOICE_EVENTS.WAKE_WORD_DETECTED,
        (event: { phrase: string }) => {
          callbacksRef.current.onWakeWordDetected?.(event.phrase)
        }
      ),

      eventEmitter.addListener(
        KIAAN_VOICE_EVENTS.ERROR,
        (event: KiaanVoiceError) => {
          setError(event)
          metricsRef.current.retryCount++
          callbacksRef.current.onError?.(event)
        }
      ),

      eventEmitter.addListener(KIAAN_VOICE_EVENTS.READY, () => {
        setIsReady(true)
        setError(null)
        metricsRef.current.retryCount = 0
        callbacksRef.current.onReady?.()
      }),

      eventEmitter.addListener(KIAAN_VOICE_EVENTS.SPEAKING_START, () => {
        setIsSpeaking(true)
        callbacksRef.current.onSpeakingStart?.()
      }),

      eventEmitter.addListener(KIAAN_VOICE_EVENTS.SPEAKING_END, () => {
        setIsSpeaking(false)
        callbacksRef.current.onSpeakingEnd?.()
      }),
    ]

    return () => {
      subscriptions.forEach((sub) => sub.remove())
    }
  }, [config.useOnDeviceRecognition])

  // ========================================================================
  // Actions
  // ========================================================================

  const initialize = useCallback(async () => {
    try {
      const mergedConfig: KiaanVoiceConfig = {
        ...DEFAULT_CONFIG,
        ...config,
      }
      await KiaanVoiceModule.initialize(mergedConfig)
    } catch (err: unknown) {
      setError({
        type: 'unknown',
        message: err instanceof Error ? err.message : 'Failed to initialize',
        isRecoverable: false,
      })
    }
  }, [config])

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await KiaanVoiceModule.requestPermissions()
      setHasPermission(granted)
      return granted
    } catch (err: unknown) {
      setError({
        type: 'permission_denied',
        message: err instanceof Error ? err.message : 'Permission denied',
        isRecoverable: false,
      })
      return false
    }
  }, [])

  const activate = useCallback(async () => {
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    metricsRef.current.activationTime = Date.now()
    await KiaanVoiceModule.activate()
  }, [])

  const stopListening = useCallback(async () => {
    await KiaanVoiceModule.stopListening()
  }, [])

  const enableWakeWord = useCallback(async () => {
    await KiaanVoiceModule.enableWakeWord()
  }, [])

  const disableWakeWord = useCallback(async () => {
    await KiaanVoiceModule.disableWakeWord()
  }, [])

  const speak = useCallback(async (text: string) => {
    await KiaanVoiceModule.speak(text)
  }, [])

  const stopSpeaking = useCallback(async () => {
    await KiaanVoiceModule.stopSpeaking()
  }, [])

  const reset = useCallback(async () => {
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    metricsRef.current.retryCount = 0
    await KiaanVoiceModule.reset()
  }, [])

  // ========================================================================
  // Auto-initialize
  // ========================================================================

  useEffect(() => {
    if (autoInitialize) {
      initialize()
    }

    return () => {
      KiaanVoiceModule.destroy()
    }
  }, [autoInitialize, initialize])

  // ========================================================================
  // Return
  // ========================================================================

  return {
    // State
    state,
    transcript,
    interimTranscript,
    isListening,
    isSpeaking,
    isReady,
    hasPermission,
    error,

    // Actions
    initialize,
    requestPermissions,
    activate,
    stopListening,
    enableWakeWord,
    disableWakeWord,
    speak,
    stopSpeaking,
    reset,

    // Metrics
    metrics,
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { KiaanVoiceState, KiaanVoiceError, KiaanVoiceConfig } from './KiaanVoiceInterface'
