/**
 * useVoiceInput — Speech-to-Text Hook
 *
 * Clean, minimal hook for voice input across the MindVibe platform.
 * Built from scratch as a standalone voice-to-text entity.
 *
 * Strategy:
 *   Tier 1: Browser Web Speech API (Chrome/Edge/Safari — 95%+ of users)
 *   Tier 2: Server-side transcription via /api/voice/transcribe (Firefox, others)
 *   Tier 3: Graceful error with "please type instead" message
 *
 * Features:
 *   - Clean start/stop lifecycle
 *   - Interim + final transcript delivery
 *   - Online/offline awareness
 *   - Compassionate error messages
 *   - Status tracking (idle | listening | processing | error | offline)
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SpeechRecognitionService } from '@/utils/speech/recognition'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'
import { canUseVoiceInput, isSecureContext, getBrowserName } from '@/utils/browserSupport'

export type VTTStatus = 'idle' | 'listening' | 'processing' | 'error' | 'offline'

/** Max server recording duration (2 minutes) */
const MAX_RECORDING_MS = 120_000

/** Min audio blob size to submit — filters mic-activation noise */
const MIN_AUDIO_BYTES = 1000

export interface UseVoiceInputOptions {
  language?: string
  onTranscript?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
  autoSend?: boolean
  punctuationAssist?: boolean
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
  sttProvider: string
  deviceTier: string
  status: VTTStatus
  isOnline: boolean
  confidence: number
  serverProgressMessage: string
}

/**
 * Capitalize first letter, add trailing period if missing.
 */
function addPunctuation(text: string): string {
  if (!text.trim()) return text
  let s = text.trim()
  s = s.charAt(0).toUpperCase() + s.slice(1)
  if (!/[.!?।॥]$/.test(s)) s += '.'
  return s
}

/**
 * Map raw error codes to user-friendly messages.
 */
function friendlyError(raw: string): string {
  if (raw.includes('not-allowed') || raw.includes('permission')) {
    return 'Microphone access denied. Please allow microphone permissions in your browser settings.'
  }
  if (raw.includes('no-speech')) {
    return 'No speech detected. Please speak clearly and try again.'
  }
  if (raw.includes('network')) {
    return 'Network error. Please check your internet connection.'
  }
  if (raw.includes('audio-capture')) {
    return 'Microphone not found. Please check your microphone connection.'
  }
  if (raw.includes('service-not-allowed')) {
    return 'Speech recognition service is unavailable. Please try again later.'
  }
  if (raw.includes('aborted')) {
    return 'Voice input was interrupted. You can try again when ready.'
  }
  return raw
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
  const [webSpeechSupported] = useState(() => isSpeechRecognitionSupported())
  const [currentProvider, setCurrentProvider] = useState<'none' | 'web-speech-api' | 'server'>('none')

  const recognitionRef = useRef<SpeechRecognitionService | null>(null)
  const activeTier = useRef<'none' | 'web-speech' | 'server'>('none')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Set both ref and state for the active tier */
  const setActiveTier = useCallback((tier: 'none' | 'web-speech' | 'server') => {
    activeTier.current = tier
    const providerMap = { 'none': 'none', 'web-speech': 'web-speech-api', 'server': 'server' } as const
    setCurrentProvider(providerMap[tier])
  }, [])

  // Stable refs for callbacks to avoid stale closures
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onErrorRef.current = onError
  })

  // ── Online/offline tracking ──
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => { setIsOnline(false); setStatus('offline') }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // ── Initialize Web Speech API recognition (Tier 1) ──
  useEffect(() => {
    if (!webSpeechSupported) return

    recognitionRef.current = new SpeechRecognitionService({
      language,
      continuous: true,
      interimResults: true,
    })

    return () => {
      recognitionRef.current?.destroy()
      recognitionRef.current = null
    }
  }, [webSpeechSupported, language])

  // Update language on existing recognition instance
  useEffect(() => {
    recognitionRef.current?.setLanguage(language)
  }, [language])

  // ── Clear max-duration timer ──
  const clearMaxTimer = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
  }, [])

  // ── Tier 2: Server transcription via MediaRecorder ──
  const startServerTranscription = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!stream.getAudioTracks().length) {
        stream.getTracks().forEach(t => t.stop())
        return false
      }

      streamRef.current = stream
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        clearMaxTimer()

        // Release mic
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setActiveTier('none')

        if (!mountedRef.current) { chunksRef.current = []; return }
        if (chunksRef.current.length === 0) {
          setIsListening(false); setStatus('idle'); return
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []

        if (blob.size < MIN_AUDIO_BYTES) {
          setIsListening(false); setStatus('idle'); return
        }

        setStatus('processing')
        setInterimTranscript('')
        setServerProgressMessage('Uploading audio...')

        const abort = new AbortController()
        const timeout = setTimeout(() => abort.abort(), 60000)

        try {
          const form = new FormData()
          form.append('audio', blob, 'recording.webm')
          form.append('language', language)

          setServerProgressMessage('Transcribing...')
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: form,
            signal: abort.signal,
          })

          clearTimeout(timeout)
          if (!mountedRef.current) return

          if (res.ok) {
            const data = await res.json()
            if (!mountedRef.current) return
            const text = data.transcript || ''
            setServerProgressMessage('')
            if (text.trim()) {
              const final = punctuationAssist ? addPunctuation(text) : text
              setTranscript(final)
              setConfidence(data.confidence ?? 0)
              onTranscriptRef.current?.(final, true)
            }
          } else {
            const data = await res.json().catch(() => ({}))
            if (!mountedRef.current) return
            setServerProgressMessage('')
            const msg = data.error || 'Server transcription failed'
            setError(msg); setStatus('error')
            onErrorRef.current?.(msg)
          }
        } catch (err) {
          clearTimeout(timeout)
          if (!mountedRef.current) return
          setServerProgressMessage('')
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

      recorderRef.current = recorder
      recorder.start(1000)
      setActiveTier('server')
      setIsListening(true)
      setStatus('listening')

      // Safety auto-stop
      maxTimerRef.current = setTimeout(() => {
        if (recorderRef.current?.state !== 'inactive') {
          recorderRef.current?.stop()
        }
      }, MAX_RECORDING_MS)

      return true
    } catch {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      return false
    }
  }, [language, punctuationAssist, clearMaxTimer, setActiveTier])

  // ── Start listening (main entry) ──
  const startListening = useCallback(async () => {
    const voiceCheck = canUseVoiceInput()

    if (!voiceCheck.available && !isOnline) {
      const msg = 'Voice input requires an internet connection. Please type your message.'
      setError(msg); setStatus('offline')
      onErrorRef.current?.(msg)
      return
    }

    if (!isSecureContext()) {
      const msg = 'Voice features require HTTPS or localhost.'
      setError(msg); setStatus('error')
      onErrorRef.current?.(msg)
      return
    }

    // Reset state
    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
    setActiveTier('none')

    // ── Tier 1: Web Speech API ──
    if (recognitionRef.current && webSpeechSupported) {
      setActiveTier('web-speech')
      await recognitionRef.current.start({
        onStart: () => {
          if (!mountedRef.current || activeTier.current !== 'web-speech') return
          setIsListening(true)
          setStatus('listening')
        },
        onResult: (text, isFinal, resultConf) => {
          if (!mountedRef.current || activeTier.current !== 'web-speech') return
          if (isFinal) {
            const final = punctuationAssist ? addPunctuation(text) : text
            setTranscript(final)
            setInterimTranscript('')
            setConfidence(resultConf ?? 0)
            setStatus('processing')
            onTranscriptRef.current?.(final, true)
          } else {
            setInterimTranscript(text)
            onTranscriptRef.current?.(text, false)
          }
        },
        onEnd: () => {
          if (!mountedRef.current) return
          setActiveTier('none')
          setIsListening(false)
          setInterimTranscript('')
          setStatus('idle')
        },
        onError: (err) => {
          if (!mountedRef.current) return
          setActiveTier('none')
          const msg = friendlyError(err)
          setError(msg)
          setIsListening(false)
          setInterimTranscript('')
          setStatus('error')
          onErrorRef.current?.(msg)
        },
      })
      return
    }

    // ── Tier 2: Server transcription ──
    if (isOnline) {
      const started = await startServerTranscription()
      if (started) return
    }

    // ── Tier 3: Nothing available ──
    const browser = getBrowserName()
    const msg = `Speech recognition not available in ${browser}. Please type your message instead.`
    setError(msg); setStatus('error')
    onErrorRef.current?.(msg)
  }, [webSpeechSupported, isOnline, punctuationAssist, startServerTranscription, setActiveTier])

  // ── Stop listening ──
  const stopListening = useCallback(() => {
    const tier = activeTier.current

    if (tier === 'server' && recorderRef.current) {
      clearMaxTimer()
      if (recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      return // onstop handler handles the rest
    }

    if (tier === 'web-speech' && recognitionRef.current) {
      recognitionRef.current.stop()
      setActiveTier('none')
    }

    setIsListening(false)
    setInterimTranscript('')
    setStatus('idle')
  }, [clearMaxTimer, setActiveTier])

  // ── Reset transcript ──
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setConfidence(0)
    setStatus('idle')
  }, [])

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      mountedRef.current = false
      activeTier.current = 'none'
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
      if (recorderRef.current?.state !== 'inactive') {
        try { recorderRef.current?.stop() } catch { /* ok */ }
      }
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      chunksRef.current = []
      recognitionRef.current?.destroy()
      recognitionRef.current = null
    }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported: webSpeechSupported || isOnline,
    error,
    startListening,
    stopListening,
    resetTranscript,
    sttProvider: currentProvider,
    deviceTier: 'low',
    status,
    isOnline,
    confidence,
    serverProgressMessage,
  }
}
