/**
 * useVoiceInput — Speech-to-Text Hook
 *
 * Simple 3-tier fallback:
 *   Tier 1: Browser Web Speech API (Chrome/Edge/Safari — 95%+ of users)
 *   Tier 2: Server-side transcription via /api/voice/transcribe (Firefox, others)
 *   Tier 3: Graceful error with "please type instead" message
 *
 * Features:
 *   - Punctuation post-processing for languages lacking native punctuation
 *   - Confidence score pass-through
 *   - Online/offline awareness
 *   - Status tracking (idle | listening | processing | error | offline)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { canUseVoiceInput, isSecureContext, getBrowserName } from '@/utils/browserSupport'

export type VTTStatus = 'idle' | 'listening' | 'processing' | 'error' | 'offline'

/** Maximum recording duration in milliseconds for server transcription */
const MAX_RECORDING_DURATION_MS = 120_000 // 2 minutes

/** Minimum audio blob size to send to server (bytes) — filter out click/noise */
const MIN_AUDIO_BLOB_SIZE = 1000 // ~1KB

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
  /** Which STT provider is active: 'web-speech-api' | 'server' | 'none' */
  sttProvider: string
  /** Device capability tier (always 'low' — on-device ML removed) */
  deviceTier: string
  /** Current status of the STT system */
  status: VTTStatus
  /** Whether the device is online */
  isOnline: boolean
  /** Confidence of last final result (0-1) */
  confidence: number
  /** Server transcription progress message (shown during Tier 2 processing) */
  serverProgressMessage: string
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
  const [serverProgressMessage, setServerProgressMessage] = useState('')
  const [isWebSpeechSupported] = useState(() => isSpeechRecognitionSupported())

  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const [usingServer, setUsingServer] = useState(false)
  /** Which tier is active — 'web-speech' or 'server' */
  const activeTierRef = useRef<'none' | 'web-speech' | 'server'>('none')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  /** Auto-stop timer for server recording max duration */
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Stable refs for parent callbacks to avoid stale closures in async handlers
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  onTranscriptRef.current = onTranscript
  onErrorRef.current = onError

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

  // Web Speech API (Tier 1) — initialize only if supported
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

  /** Clear the max-duration safety timer for server recording */
  const clearMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current)
      maxDurationTimerRef.current = null
    }
  }, [])

  /**
   * Tier 2: Server-side transcription via MediaRecorder → /api/voice/transcribe
   * Used when Web Speech API is unavailable (Firefox, etc.).
   */
  const startServerTranscription = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Validate we actually got audio tracks
      if (!stream.getAudioTracks().length) {
        stream.getTracks().forEach(t => t.stop())
        return false
      }

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
        clearMaxDurationTimer()

        // Release mic
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop())
          mediaStreamRef.current = null
        }

        activeTierRef.current = 'none'

        // Guard: component may have unmounted while recording
        if (!mountedRef.current) {
          audioChunksRef.current = []
          return
        }

        if (audioChunksRef.current.length === 0) {
          setIsListening(false)
          setStatus('idle')
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = []

        // Skip upload if audio is too small (likely just mic activation noise)
        if (audioBlob.size < MIN_AUDIO_BLOB_SIZE) {
          setIsListening(false)
          setStatus('idle')
          return
        }

        setStatus('processing')
        setInterimTranscript('')
        setServerProgressMessage('Uploading audio...')

        // Use AbortController so we can cancel the fetch on unmount
        const abortController = new AbortController()
        const timeoutId = setTimeout(() => abortController.abort(), 60000)

        try {
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')
          formData.append('language', language)

          setServerProgressMessage('Transcribing...')
          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
            signal: abortController.signal,
          })

          clearTimeout(timeoutId)
          if (!mountedRef.current) return

          if (response.ok) {
            const data = await response.json()
            if (!mountedRef.current) return
            const text = data.transcript || ''
            setServerProgressMessage('')
            if (text.trim()) {
              const finalText = punctuationAssist ? applyPunctuationAssist(text) : text
              setTranscript(finalText)
              setConfidence(data.confidence ?? 0)
              onTranscriptRef.current?.(finalText, true)
            }
          } else {
            const data = await response.json().catch(() => ({}))
            if (!mountedRef.current) return
            setServerProgressMessage('')
            const msg = data.error || 'Server transcription failed'
            setError(msg)
            setStatus('error')
            onErrorRef.current?.(msg)
          }
        } catch (err) {
          clearTimeout(timeoutId)
          if (!mountedRef.current) return
          setServerProgressMessage('')
          // Don't show error for intentional aborts
          if (err instanceof DOMException && err.name === 'AbortError') {
            setStatus('idle')
          } else {
            setError('Server transcription unavailable. Please type your message.')
            setStatus('error')
            onErrorRef.current?.('Server transcription unavailable.')
          }
        }

        if (!mountedRef.current) return
        setIsListening(false)
        setStatus(prev => prev === 'error' ? 'error' : 'idle')
      }

      mediaRecorderRef.current = recorder
      // Collect data every 1 second for progressive feedback
      recorder.start(1000)
      activeTierRef.current = 'server'
      setUsingServer(true)
      setIsListening(true)
      setStatus('listening')

      // Safety: auto-stop after max duration to prevent memory bloat
      maxDurationTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      }, MAX_RECORDING_DURATION_MS)

      return true
    } catch {
      // Release mic if getUserMedia succeeded but something else failed
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      return false
    }
  }, [language, punctuationAssist, clearMaxDurationTimer])

  const startListening = useCallback(async () => {
    // Pre-flight: check basic availability
    const voiceCheck = canUseVoiceInput()

    if (!voiceCheck.available && !isOnline) {
      const errorMsg = 'Voice input requires an internet connection. Please type your message.'
      setError(errorMsg)
      setStatus('offline')
      onErrorRef.current?.(errorMsg)
      return
    }

    if (!isSecureContext()) {
      const errorMsg = 'Voice features require HTTPS or localhost.'
      setError(errorMsg)
      setStatus('error')
      onErrorRef.current?.(errorMsg)
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
    activeTierRef.current = 'none'
    setUsingServer(false)

    // ── Tier 1: Web Speech API (Chrome, Edge, Safari) ──
    if (recognitionRef.current && isWebSpeechSupported) {
      activeTierRef.current = 'web-speech'
      await recognitionRef.current.start({
        onStart: () => {
          if (!mountedRef.current || activeTierRef.current !== 'web-speech') return
          setIsListening(true)
          setStatus('listening')
        },
        onResult: (text, isFinal, resultConfidence) => {
          if (!mountedRef.current || activeTierRef.current !== 'web-speech') return
          if (isFinal) {
            const finalText = punctuationAssist ? applyPunctuationAssist(text) : text
            setTranscript(finalText)
            setInterimTranscript('')
            setConfidence(resultConfidence ?? 0)
            setStatus('processing')
            onTranscriptRef.current?.(finalText, true)
          } else {
            setInterimTranscript(text)
            onTranscriptRef.current?.(text, false)
          }
        },
        onEnd: () => {
          if (!mountedRef.current) return
          activeTierRef.current = 'none'
          setIsListening(false)
          setInterimTranscript('')
          setStatus('idle')
        },
        onError: (err) => {
          if (!mountedRef.current) return
          activeTierRef.current = 'none'
          const compassionateMsg = getCompassionateError(err)
          setError(compassionateMsg)
          setIsListening(false)
          setInterimTranscript('')
          setStatus('error')
          onErrorRef.current?.(compassionateMsg)
        },
      })
      return
    }

    // ── Tier 2: Server-side transcription via MediaRecorder ──
    if (isOnline) {
      const started = await startServerTranscription()
      if (started) return
    }

    // ── Tier 3: Nothing works — graceful message ──
    const browserName = getBrowserName()
    const errorMsg = `Speech recognition not available in ${browserName}. Please type your message instead.`
    setError(errorMsg)
    setStatus('error')
    onErrorRef.current?.(errorMsg)
  }, [isWebSpeechSupported, isOnline, punctuationAssist, startServerTranscription])

  const stopListening = useCallback(() => {
    const tier = activeTierRef.current

    if (tier === 'server' && mediaRecorderRef.current) {
      clearMaxDurationTimer()
      // Stopping the recorder triggers onstop → sends to server
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      setUsingServer(false)
      return // Don't reset status yet — onstop handler will do transcription
    }

    if (tier === 'web-speech' && recognitionRef.current) {
      recognitionRef.current.stop()
      activeTierRef.current = 'none'
    }

    setIsListening(false)
    setInterimTranscript('')
    setStatus('idle')
  }, [clearMaxDurationTimer])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setConfidence(0)
    setStatus('idle')
  }, [])

  // Cleanup all voice resources on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      activeTierRef.current = 'none'
      // Clear max-duration safety timer
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current)
        maxDurationTimerRef.current = null
      }
      // Stop MediaRecorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop() } catch { /* already stopped */ }
      }
      // Release microphone
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      // Clear buffered audio to free memory
      audioChunksRef.current = []
      // Stop Web Speech API recognition
      if (recognitionRef.current) {
        recognitionRef.current.destroy()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isWebSpeechSupported || isOnline,
    error,
    startListening,
    stopListening,
    resetTranscript,
    sttProvider: activeTierRef.current === 'server'
      ? 'server'
      : activeTierRef.current === 'web-speech'
        ? 'web-speech-api'
        : 'none',
    deviceTier: 'low',
    status,
    isOnline,
    confidence,
    serverProgressMessage,
  }
}
