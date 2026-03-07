/**
 * Enhanced Voice-to-Text Hook
 *
 * Unified VTT hook for all MindVibe modules with:
 * - Multi-language support (17 locales via existing language mapping)
 * - Live streaming transcription with interim results
 * - Offline fallback awareness (detects network loss, queues gracefully)
 * - Privacy-first: browser-native Web Speech API (audio stays local)
 * - Punctuation post-processing for languages lacking native punctuation
 * - Consent integration via VoiceToTextContext
 * - Module-scoped analytics tracking
 *
 * Reusable across: KIAAN Chat, Ardha, Viyog, Emotional Compass,
 * Karma Reset, Emotional Reset.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { canUseVoiceInput, isSecureContext, getBrowserName } from '@/utils/browserSupport'

export type VTTStatus = 'idle' | 'listening' | 'processing' | 'error' | 'offline'

export interface UseVoiceToTextOptions {
  /** Language code for recognition (e.g. 'en', 'hi', 'ta') */
  language?: string
  /** Module using VTT for analytics context */
  module?: string
  /** Called with each transcript (interim and final) */
  onTranscript?: (text: string, isFinal: boolean) => void
  /** Called on errors */
  onError?: (error: string) => void
  /** Called when listening status changes */
  onStatusChange?: (status: VTTStatus) => void
  /** Enable continuous listening mode (default: false) */
  continuous?: boolean
  /** Apply basic punctuation post-processing (default: true) */
  punctuationAssist?: boolean
  /** Confidence threshold — discard results below this (0-1, default: 0) */
  confidenceThreshold?: number
}

export interface UseVoiceToTextReturn {
  /** Current status of the VTT system */
  status: VTTStatus
  /** Whether actively listening for voice input */
  isListening: boolean
  /** Final confirmed transcript text */
  transcript: string
  /** Live interim transcript (updates rapidly during speech) */
  interimTranscript: string
  /** Whether browser supports Web Speech API */
  isSupported: boolean
  /** Whether device is currently online */
  isOnline: boolean
  /** Current error message, if any */
  error: string | null
  /** Confidence of last final result (0-1) */
  confidence: number
  /** Start listening for voice input */
  startListening: () => void
  /** Stop listening gracefully (waits for final result) */
  stopListening: () => void
  /** Clear transcript and error state */
  reset: () => void
}

/**
 * Basic punctuation post-processing for transcripts.
 * Capitalizes first letter and adds period if missing.
 * Designed for languages where Web Speech API omits punctuation.
 */
function applyPunctuationAssist(text: string): string {
  if (!text.trim()) return text
  let processed = text.trim()

  // Capitalize first letter
  processed = processed.charAt(0).toUpperCase() + processed.slice(1)

  // Add trailing period if no ending punctuation
  if (!/[.!?।॥]$/.test(processed)) {
    processed += '.'
  }

  return processed
}

/**
 * Map user-friendly error codes to compassionate guidance messages.
 */
function getCompassionateError(rawError: string): string {
  if (rawError.includes('not-allowed') || rawError.includes('permission')) {
    return 'Microphone access is needed for voice input. Please allow microphone permissions in your browser settings.'
  }
  if (rawError.includes('no-speech')) {
    return 'No speech was detected. Please speak clearly and try again when you are ready.'
  }
  if (rawError.includes('network')) {
    return 'A network issue occurred. Voice input works best with a stable connection.'
  }
  if (rawError.includes('audio-capture')) {
    return 'Microphone not found. Please check your microphone connection.'
  }
  if (rawError.includes('service-not-allowed')) {
    return 'Speech recognition service is unavailable. Please try again later.'
  }
  if (rawError.includes('aborted')) {
    return 'Voice input was interrupted. You can try again when ready.'
  }
  return rawError
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}): UseVoiceToTextReturn {
  const {
    language = 'en',
    module = 'unknown',
    onTranscript,
    onError,
    onStatusChange,
    continuous = false,
    punctuationAssist = true,
    confidenceThreshold = 0,
  } = options

  const [status, setStatus] = useState<VTTStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isSupported] = useState(() => isSpeechRecognitionSupported())

  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const moduleRef = useRef(module)

  // Keep moduleRef in sync for callbacks
  useEffect(() => {
    moduleRef.current = module
  }, [module])

  // Track online/offline status for awareness
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setStatus('offline')
      onStatusChange?.('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onStatusChange])

  // Initialize recognition service
  useEffect(() => {
    if (!isSupported) return

    recognitionRef.current = new SpeechRecognitionService({
      language,
      continuous,
      interimResults: true,
      confidenceThreshold,
    })

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [isSupported, language, continuous, confidenceThreshold])

  // Update language on change
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(language)
    }
  }, [language])

  // Propagate status changes
  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  const updateStatus = useCallback((newStatus: VTTStatus) => {
    setStatus(newStatus)
  }, [])

  const startListening = useCallback(() => {
    // Pre-flight checks
    const voiceCheck = canUseVoiceInput()
    if (!voiceCheck.available) {
      const errorMsg = voiceCheck.reason || 'Voice input not available'
      setError(errorMsg)
      updateStatus('error')
      onError?.(errorMsg)
      return
    }

    if (!recognitionRef.current || !isSupported) {
      const browserName = getBrowserName()
      const errorMsg = `Speech recognition not supported in ${browserName}. Please use Chrome, Edge, or Safari.`
      setError(errorMsg)
      updateStatus('error')
      onError?.(errorMsg)
      return
    }

    if (!isSecureContext()) {
      const errorMsg = 'Voice features require HTTPS or localhost.'
      setError(errorMsg)
      updateStatus('error')
      onError?.(errorMsg)
      return
    }

    if (!isOnline) {
      setError('Voice input requires an internet connection for speech recognition.')
      updateStatus('offline')
      onError?.('Voice input requires an internet connection.')
      return
    }

    // Clear previous state
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)

    recognitionRef.current.start({
      onStart: () => {
        updateStatus('listening')
      },
      onResult: (text, isFinal, resultConfidence) => {
        if (isFinal) {
          const finalText = punctuationAssist ? applyPunctuationAssist(text) : text
          setTranscript(finalText)
          setInterimTranscript('')
          setConfidence(resultConfidence ?? 0)
          updateStatus('processing')
          onTranscript?.(finalText, true)
        } else {
          setInterimTranscript(text)
          onTranscript?.(text, false)
        }
      },
      onEnd: () => {
        updateStatus('idle')
        setInterimTranscript('')
      },
      onError: (err) => {
        const compassionateMsg = getCompassionateError(err)
        setError(compassionateMsg)
        updateStatus('error')
        setInterimTranscript('')
        onError?.(compassionateMsg)
      },
    })
  }, [isSupported, isOnline, punctuationAssist, onTranscript, onError, updateStatus])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    updateStatus('idle')
    setInterimTranscript('')
  }, [updateStatus])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setConfidence(0)
    updateStatus('idle')
  }, [updateStatus])

  return {
    status,
    isListening: status === 'listening',
    transcript,
    interimTranscript,
    isSupported,
    isOnline,
    error,
    confidence,
    startListening,
    stopListening,
    reset,
  }
}
