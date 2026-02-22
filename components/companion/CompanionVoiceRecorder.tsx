'use client'

/**
 * CompanionVoiceRecorder - Voice input for the KIAAN best friend chat.
 *
 * Handles voice recording with visual feedback, transcription,
 * and seamless integration with the chat flow. Supports both
 * tap-to-record and hold-to-record modes.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

// BCP-47 language tags for Web Speech API multilingual STT
const LANGUAGE_BCP47: Record<string, string> = {
  en: 'en-US', hi: 'hi-IN', sa: 'sa-IN', ta: 'ta-IN', te: 'te-IN',
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
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch { /* recognition may already be stopped */ }
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (isDisabled || isProcessing) return

    // Use Web Speech API for transcription (browser-native, no backend needed)
    const win = window as unknown as Window & Record<string, unknown>
    const SpeechRecognition =
      (win.SpeechRecognition as typeof globalThis.SpeechRecognition | undefined) || (win.webkitSpeechRecognition as typeof globalThis.SpeechRecognition | undefined)

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = LANGUAGE_BCP47[language] || 'en-US'

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (event.results?.length > 0 && event.results[0]?.length > 0) {
            const transcript = event.results[0][0].transcript
            if (transcript?.trim()) {
              onTranscription(transcript.trim())
            }
          }
          setState('idle')
          setDuration(0)
        }

        recognition.onerror = () => {
          setState('idle')
          setDuration(0)
        }

        recognition.onend = () => {
          if (state === 'recording') {
            setState('idle')
            setDuration(0)
          }
        }

        recognitionRef.current = recognition
        recognition.start()
        setState('recording')

        // Duration timer
        const startTime = Date.now()
        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - startTime) / 1000))
        }, 1000)

      } catch {
        // Fallback: prompt user to type instead
        setState('idle')
      }
    }
  }, [isDisabled, isProcessing, onTranscription, state, language])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch { /* recognition may already be stopped */ }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setState('idle')
    setDuration(0)
  }, [])

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
            {/* Recording pulse animation */}
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
            <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>

      {/* Recording duration */}
      {state === 'recording' && (
        <span className="text-xs text-red-500 font-mono animate-pulse">
          {formatDuration(duration)}
        </span>
      )}

      {/* Transcribing indicator */}
      {state === 'transcribing' && (
        <span className="text-xs text-violet-500 flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Listening...
        </span>
      )}
    </div>
  )
})

export default CompanionVoiceRecorder
