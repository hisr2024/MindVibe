/**
 * useVoiceInput — Unified Speech-to-Text Hook (Never-Fail STT)
 *
 * Bulletproof 4-tier fallback chain:
 *   Tier 1: On-device STT (Moonshine for English, Whisper for Indian languages)
 *   Tier 2: Browser Web Speech API (Chrome/Edge/Safari native)
 *   Tier 3: Server-side transcription via /api/voice/transcribe (Whisper backend)
 *   Tier 4: Graceful error with "please type instead" message
 *
 * Features absorbed from the deleted useVoiceToText hook:
 *   - Punctuation post-processing for languages lacking native punctuation
 *   - Confidence score pass-through
 *   - Online/offline awareness
 *   - Status tracking (idle | listening | processing | error | offline)
 *
 * Tier 3 (budget phones): zero extra RAM — uses browser-native STT only.
 * If the browser doesn't support Web Speech API and on-device fails,
 * falls back to server-side transcription via MediaRecorder.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { canUseVoiceInput, isSecureContext, getBrowserName } from '@/utils/browserSupport'
import { useOnDeviceSTT } from '@/hooks/useOnDeviceSTT'

export type VTTStatus = 'idle' | 'listening' | 'processing' | 'error' | 'offline'

export interface UseVoiceInputOptions {
  language?: string
  onTranscript?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  autoSend?: boolean
  /** Apply basic punctuation post-processing (default: false) */
  punctuationAssist?: boolean
  /** Module name for analytics context (ignored by hook, available for callers) */
  module?: string
}

export interface UseVoiceInputReturn {
  isListening: boolean
  transcript: string
  interimTranscript: string
  isSupported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  /** Which STT provider is active: 'moonshine' | 'whisper' | 'web-speech-api' | 'server' | 'none' */
  sttProvider: string
  /** Device capability tier: 'high' | 'mid' | 'low' */
  deviceTier: string
  /** Current status of the STT system */
  status: VTTStatus
  /** Whether the device is online */
  isOnline: boolean
  /** Confidence of last final result (0-1) */
  confidence: number
}

/**
 * Capitalize first letter and add trailing period if missing.
 * Designed for languages where Web Speech API omits punctuation.
 */
function applyPunctuationAssist(text: string): string {
  if (!text.trim()) return text
  let processed = text.trim()
  processed = processed.charAt(0).toUpperCase() + processed.slice(1)
  if (!/[.!?।॥]$/.test(processed)) {
    processed += '.'
  }
  return processed
}

/**
 * Map raw error codes to compassionate guidance messages.
 */
function getCompassionateError(rawError: string): string {
  if (rawError.includes('not-allowed') || rawError.includes('permission denied') || rawError.includes('permission')) {
    return 'Microphone access denied. Please allow microphone permissions in your browser settings.'
  }
  if (rawError.includes('no-speech')) {
    return 'No speech detected. Please speak clearly and try again.'
  }
  if (rawError.includes('network')) {
    return 'Network error. Please check your internet connection.'
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

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'en',
    onTranscript,
    onError,
    punctuationAssist = false,
  } = options

  const [status, setStatus] = useState<VTTStatus>('idle')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isWebSpeechSupported] = useState(() => isSpeechRecognitionSupported())

  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const [usingServer, setUsingServer] = useState(false)
  const usingOnDeviceRef = useRef(false)
  const usingServerRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      setStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // On-device STT (Tier 1 — zero overhead for Tier 3 devices)
  const onDeviceSTT = useOnDeviceSTT({
    language,
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (!usingOnDeviceRef.current) return
      if (isFinal) {
        const finalText = punctuationAssist ? applyPunctuationAssist(text) : text
        setTranscript(finalText)
        setInterimTranscript('')
        setStatus('processing')
        onTranscript?.(finalText, true)
      } else {
        setInterimTranscript(text)
        onTranscript?.(text, false)
      }
    }, [onTranscript, punctuationAssist]),
    onError: useCallback((err: string) => {
      // On-device failed → caller will fall back to Web Speech API
      usingOnDeviceRef.current = false
      onError?.(err)
    }, [onError]),
  })

  // Web Speech API (Tier 2) — initialize only if supported
  useEffect(() => {
    if (!isWebSpeechSupported) return

    recognitionRef.current = new SpeechRecognitionService({
      language,
      continuous: true,
      interimResults: true,
    })

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [isWebSpeechSupported, language])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.setLanguage(language)
    }
  }, [language])

  /**
   * Tier 3: Server-side transcription via MediaRecorder → /api/voice/transcribe
   * Used when both on-device and Web Speech API are unavailable.
   */
  const startServerTranscription = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        // Release mic
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop())
          mediaStreamRef.current = null
        }

        // Guard: component may have unmounted while recording
        if (!mountedRef.current) return

        if (audioChunksRef.current.length === 0) {
          setIsListening(false)
          setStatus('idle')
          return
        }

        setStatus('processing')
        setInterimTranscript('')

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          formData.append('language', language)

          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000),
          })

          if (!mountedRef.current) return

          if (response.ok) {
            const data = await response.json()
            const text = data.transcript || ''
            if (text.trim()) {
              const finalText = punctuationAssist ? applyPunctuationAssist(text) : text
              setTranscript(finalText)
              setConfidence(data.confidence ?? 0)
              onTranscript?.(finalText, true)
            }
          } else {
            const data = await response.json().catch(() => ({}))
            const msg = data.error || 'Server transcription failed'
            setError(msg)
            setStatus('error')
            onError?.(msg)
          }
        } catch {
          if (!mountedRef.current) return
          setError('Server transcription unavailable. Please type your message.')
          setStatus('error')
          onError?.('Server transcription unavailable.')
        }

        if (!mountedRef.current) return
        setIsListening(false)
        setStatus(prev => prev === 'error' ? 'error' : 'idle')
      }

      mediaRecorderRef.current = recorder
      // Collect data every 1 second for progressive feedback
      recorder.start(1000)
      usingServerRef.current = true
      setUsingServer(true)
      setIsListening(true)
      setStatus('listening')
      return true
    } catch {
      // Release mic if getUserMedia succeeded but something else failed
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      return false
    }
  }, [language, punctuationAssist, onTranscript, onError])

  const startListening = useCallback(async () => {
    // Pre-flight: check basic availability
    const voiceCheck = canUseVoiceInput()
    const hasAnySTT = voiceCheck.available || onDeviceSTT.canHandleSTT || isWebSpeechSupported

    if (!hasAnySTT && !isOnline) {
      const errorMsg = 'Voice input requires an internet connection. Please type your message.'
      setError(errorMsg)
      setStatus('offline')
      onError?.(errorMsg)
      return
    }

    if (!isSecureContext()) {
      const errorMsg = 'Voice features require HTTPS or localhost.'
      setError(errorMsg)
      setStatus('error')
      onError?.(errorMsg)
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
    usingServerRef.current = false
    setUsingServer(false)

    // ── Tier 1: On-device STT (Moonshine/Whisper) ──
    // Only attempt if model is fully loaded and provider is on-device.
    // On-device STT throws if not ready, triggering fallback to Tier 2.
    if (onDeviceSTT.canHandleSTT && onDeviceSTT.isModelLoaded) {
      usingOnDeviceRef.current = true
      try {
        await onDeviceSTT.startListening()
        // Verify it actually started — the model may have silently degraded
        if (onDeviceSTT.isListening) {
          setIsListening(true)
          setStatus('listening')
        } else {
          usingOnDeviceRef.current = false
        }
      } catch {
        // On-device failed — fall through to Tier 2
        usingOnDeviceRef.current = false
      }
      if (usingOnDeviceRef.current) return
    }

    // ── Tier 2: Web Speech API ──
    usingOnDeviceRef.current = false
    if (recognitionRef.current && isWebSpeechSupported) {
      // Await mic permission + recognition.start() so the UI only shows
      // "listening" after the microphone is actually capturing audio.
      await recognitionRef.current.start({
        onStart: () => {
          setIsListening(true)
          setStatus('listening')
        },
        onResult: (text, isFinal, resultConfidence) => {
          if (isFinal) {
            const finalText = punctuationAssist ? applyPunctuationAssist(text) : text
            setTranscript(finalText)
            setInterimTranscript('')
            setConfidence(resultConfidence ?? 0)
            setStatus('processing')
            onTranscript?.(finalText, true)
          } else {
            setInterimTranscript(text)
            onTranscript?.(text, false)
          }
        },
        onEnd: () => {
          setIsListening(false)
          setInterimTranscript('')
          setStatus('idle')
        },
        onError: (err) => {
          const compassionateMsg = getCompassionateError(err)
          setError(compassionateMsg)
          setIsListening(false)
          setInterimTranscript('')
          setStatus('error')
          onError?.(compassionateMsg)
        },
      })
      return
    }

    // ── Tier 3: Server-side transcription via MediaRecorder ──
    if (isOnline) {
      const started = await startServerTranscription()
      if (started) return
    }

    // ── Tier 4: Nothing works — graceful message ──
    const browserName = getBrowserName()
    const errorMsg = `Speech recognition not available in ${browserName}. Please type your message instead.`
    setError(errorMsg)
    setStatus('error')
    onError?.(errorMsg)
  }, [isWebSpeechSupported, isOnline, punctuationAssist, onTranscript, onError, onDeviceSTT, startServerTranscription])

  const stopListening = useCallback(() => {
    if (usingOnDeviceRef.current) {
      onDeviceSTT.stopListening()
    }
    if (usingServerRef.current && mediaRecorderRef.current) {
      // Stopping the recorder triggers onstop → sends to server
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      usingServerRef.current = false
      setUsingServer(false)
      return // Don't reset status yet — onstop handler will do transcription
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setInterimTranscript('')
    setStatus('idle')
  }, [onDeviceSTT])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setConfidence(0)
    setStatus('idle')
    onDeviceSTT.resetTranscript()
  }, [onDeviceSTT])

  // Cleanup all voice resources on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch { /* already stopped */ }
      }
      // Release microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      // Stop Web Speech API recognition
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isListening: isListening || onDeviceSTT.isListening,
    transcript,
    interimTranscript,
    isSupported: isWebSpeechSupported || onDeviceSTT.canHandleSTT || isOnline,
    error,
    startListening,
    stopListening,
    resetTranscript,
    sttProvider: usingServer ? 'server' : (isListening && !usingOnDeviceRef.current ? 'web-speech-api' : onDeviceSTT.sttProvider),
    deviceTier: onDeviceSTT.deviceTier,
    status,
    isOnline,
    confidence,
  }
}
