'use client'

/**
 * CompanionVoiceRecorder - Voice input for the KIAAN companion chat.
 *
 * Uses the browser-native Web Speech API for real-time speech-to-text.
 * Pre-requests microphone permission via getUserMedia to ensure the
 * browser permission dialog is triggered (Web Speech API alone may not prompt).
 *
 * Fixes applied:
 * - Timer interval cleared on final result (prevents memory leak)
 * - recognition.start() wrapped in try/catch inside setTimeout (prevents uncaught errors)
 * - stateRef used consistently to avoid React state closure staleness
 * - Accumulates all final segments in continuous mode before submitting
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ShankhaIcon } from '@/components/icons/ShankhaIcon'

// BCP-47 language tags for Web Speech API multilingual STT
const LANGUAGE_BCP47: Record<string, string> = {
  en: 'en-US', hi: 'hi-IN', sa: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
  pa: 'pa-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR',
  ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR', ar: 'ar-SA', ru: 'ru-RU',
  it: 'it-IT',
}

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  isDisabled?: boolean
  isProcessing?: boolean
  language?: string
}

type RecordingState = 'idle' | 'recording' | 'transcribing'

export interface CompanionVoiceRecorderHandle {
  triggerRecord: () => void
}

const CompanionVoiceRecorder = forwardRef<CompanionVoiceRecorderHandle, VoiceRecorderProps>(function CompanionVoiceRecorder({
  onTranscription,
  isDisabled = false,
  isProcessing = false,
  language = 'en',
}, ref) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [unsupported, setUnsupported] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  // Track recording state via ref so event handlers avoid stale closures.
  const stateRef = useRef<RecordingState>(state)
  useEffect(() => { stateRef.current = state }, [state])
  // Accumulate all final transcript segments until user taps stop
  const accumulatedRef = useRef<string>('')
  // Safety cap: max consecutive onend restarts without any result
  const restartCountRef = useRef(0)
  const maxConsecutiveRestarts = 10

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer()
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* may already be stopped */ }
      }
    }
  }, [clearTimer])

  const startRecording = useCallback(async () => {
    if (isDisabled || isProcessing) return

    // Reset accumulated transcript for new recording session
    accumulatedRef.current = ''
    restartCountRef.current = 0

    // Get SpeechRecognition constructor (standard or webkit-prefixed)
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as typeof window.SpeechRecognition | undefined

    if (!SpeechRecognitionCtor) {
      setUnsupported(true)
      return
    }

    try {
      // Pre-request microphone permission via getUserMedia.
      // Many browsers (especially mobile) require this explicit call to
      // trigger the permission dialog. The Web Speech API alone may silently fail.
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
        } catch {
          // Permission denied or no mic — recognition.start() will surface the error
        }
      }

      const recognition = new SpeechRecognitionCtor()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = LANGUAGE_BCP47[language] || 'en-US'
      recognition.maxAlternatives = 3

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const lastResult = event.results[event.results.length - 1]
        if (!lastResult) return

        // Reset restart counter — we got a result, recognition is healthy
        restartCountRef.current = 0

        if (lastResult.isFinal) {
          // Select the highest-confidence alternative
          let bestTranscript = ''
          let bestConfidence = 0
          for (let i = 0; i < lastResult.length; i++) {
            const alt = lastResult[i]
            if (alt.confidence > bestConfidence || i === 0) {
              bestTranscript = alt.transcript
              bestConfidence = alt.confidence
            }
          }

          // Accumulate final segments — don't stop yet, user may keep speaking
          if (bestTranscript.trim()) {
            const separator = accumulatedRef.current ? ' ' : ''
            accumulatedRef.current += separator + bestTranscript.trim()
          }
          setLiveTranscript(accumulatedRef.current)
        } else {
          const interim = lastResult[0]?.transcript || ''
          setLiveTranscript(accumulatedRef.current + (accumulatedRef.current ? ' ' : '') + interim)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // no-speech is normal — onend will fire and auto-restart
        if (event.error === 'no-speech') return

        // Fatal errors: not-allowed, audio-capture, aborted — stop recording
        clearTimer()
        if (accumulatedRef.current.trim()) {
          onTranscription(accumulatedRef.current.trim())
          accumulatedRef.current = ''
        }
        stateRef.current = 'idle'
        setState('idle')
        setDuration(0)
        setLiveTranscript('')
      }

      recognition.onend = () => {
        // If user hasn't tapped stop, auto-restart recognition
        // (browsers end recognition after ~60s or on pauses)
        if (stateRef.current === 'recording' && recognitionRef.current) {
          restartCountRef.current++
          if (restartCountRef.current > maxConsecutiveRestarts) {
            // Too many restarts without results — give up
            clearTimer()
            if (accumulatedRef.current.trim()) {
              onTranscription(accumulatedRef.current.trim())
              accumulatedRef.current = ''
            }
            stateRef.current = 'idle'
            setState('idle')
            setDuration(0)
            setLiveTranscript('')
            return
          }
          setTimeout(() => {
            if (stateRef.current === 'recording' && recognitionRef.current) {
              try {
                recognitionRef.current.start()
              } catch {
                // Restart failed — submit what we have and clean up
                clearTimer()
                if (accumulatedRef.current.trim()) {
                  onTranscription(accumulatedRef.current.trim())
                  accumulatedRef.current = ''
                }
                stateRef.current = 'idle'
                setState('idle')
                setDuration(0)
                setLiveTranscript('')
              }
            }
          }, 300)
          return
        }
      }

      recognitionRef.current = recognition
      recognition.start()
      stateRef.current = 'recording'
      setState('recording')
      setLiveTranscript('')

      // Duration timer
      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)

    } catch {
      setState('idle')
    }
  }, [isDisabled, isProcessing, onTranscription, language, clearTimer])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* may already be stopped */ }
    }
    clearTimer()
    // Submit accumulated transcript before resetting
    if (accumulatedRef.current.trim()) {
      onTranscription(accumulatedRef.current.trim())
      accumulatedRef.current = ''
    }
    stateRef.current = 'idle'
    setState('idle')
    setDuration(0)
    setLiveTranscript('')
    restartCountRef.current = 0
  }, [clearTimer, onTranscription])

  const toggleRecording = useCallback(() => {
    if (state === 'recording') {
      stopRecording()
    } else {
      startRecording()
    }
  }, [state, startRecording, stopRecording])

  // Expose triggerRecord for wake word integration
  useImperativeHandle(ref, () => ({
    triggerRecord: () => {
      if (state === 'idle' && !isDisabled && !isProcessing) {
        startRecording()
      }
    },
  }), [state, isDisabled, isProcessing, startRecording])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleRecording}
        disabled={isDisabled || isProcessing}
        className={`relative p-3 rounded-full transition-all duration-300 ${
          state === 'recording'
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600'
        } ${isDisabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start voice recording'}
        title={state === 'recording' ? 'Tap to stop' : 'Tap to speak'}
      >
        {state === 'recording' ? (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
            <ShankhaIcon size={20} filled className="relative z-10" />
          </>
        ) : (
          <ShankhaIcon size={20} />
        )}
      </button>

      {/* Recording duration */}
      {state === 'recording' && (
        <span className="text-xs text-red-500 font-mono animate-pulse">
          {formatDuration(duration)}
        </span>
      )}

      {/* Live transcription feedback */}
      {state === 'recording' && liveTranscript && (
        <span className="text-xs text-violet-400 italic max-w-[200px] truncate">
          {liveTranscript}
        </span>
      )}

      {/* Browser does not support speech recognition */}
      {unsupported && (
        <span className="text-xs text-amber-500">
          Voice input not supported in this browser. Please type your message.
        </span>
      )}
    </div>
  )
})

export default CompanionVoiceRecorder
