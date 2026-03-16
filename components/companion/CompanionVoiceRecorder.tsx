'use client'

/**
 * CompanionVoiceRecorder — Voice input for the KIAAN companion chat.
 *
 * Uses the unified useVoiceInput hook which provides a 3-tier STT fallback:
 *   Tier 1: Browser Web Speech API (Chrome/Edge/Safari)
 *   Tier 2: Server-side transcription via /api/voice/transcribe (Firefox, others)
 *   Tier 3: Graceful "please type instead" message
 *
 * The hook handles microphone permissions, continuous mode, auto-restart,
 * and all edge cases. This component just provides the UI.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ShankhaIcon } from '@/components/icons/ShankhaIcon'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  isDisabled?: boolean
  isProcessing?: boolean
  language?: string
}

export interface CompanionVoiceRecorderHandle {
  triggerRecord: () => void
}

const CompanionVoiceRecorder = forwardRef<CompanionVoiceRecorderHandle, VoiceRecorderProps>(function CompanionVoiceRecorder({
  onTranscription,
  isDisabled = false,
  isProcessing = false,
  language = 'en',
}, ref) {
  const [duration, setDuration] = useState(0)
  const [accumulatedText, setAccumulatedText] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Accumulate all final transcript segments until user taps stop (ref for callbacks)
  const accumulatedRef = useRef<string>('')
  // Rate limiting: prevent rapid toggle spam
  const lastToggleRef = useRef(0)
  const TOGGLE_COOLDOWN_MS = 500

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const {
    isListening,
    interimTranscript,
    isSupported,
    error: voiceError,
    startListening,
    stopListening: hookStopListening,
    resetTranscript,
    status,
    sttProvider,
    confidence,
    serverProgressMessage,
  } = useVoiceInput({
    language,
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        // Accumulate final segments — user may keep speaking
        const separator = accumulatedRef.current ? ' ' : ''
        accumulatedRef.current += separator + text.trim()
        setAccumulatedText(accumulatedRef.current)
      }
    }, []),
    onError: useCallback(() => {
      // Auto-stop timer when STT reports an error
      // (the hook's isListening transition will also trigger cleanup via the effect below)
    }, []),
  })

  // Build display text: accumulated finals + current interim
  const liveTranscript = accumulatedText
    + (accumulatedText && interimTranscript ? ' ' : '')
    + interimTranscript

  // Start recording: reset accumulated text, start timer, start listening
  const startRecording = useCallback(async () => {
    if (isDisabled || isProcessing) return
    // Clear any leftover timer from a previous recording session
    clearTimer()
    accumulatedRef.current = ''
    setAccumulatedText('')
    resetTranscript()
    setDuration(0)

    await startListening()

    // Duration timer
    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
  }, [isDisabled, isProcessing, startListening, resetTranscript, clearTimer])

  // Stop recording: submit accumulated transcript
  const stopRecording = useCallback(() => {
    hookStopListening()
    clearTimer()

    if (accumulatedRef.current.trim()) {
      onTranscription(accumulatedRef.current.trim())
    }
    // Reset both ref and state to prevent stale text on next recording
    accumulatedRef.current = ''
    setAccumulatedText('')
    setDuration(0)
  }, [hookStopListening, clearTimer, onTranscription])

  const toggleRecording = useCallback(() => {
    // Rate limit: ignore rapid toggles within cooldown period
    const now = Date.now()
    if (now - lastToggleRef.current < TOGGLE_COOLDOWN_MS) return
    lastToggleRef.current = now

    if (isListening) {
      stopRecording()
    } else {
      startRecording()
    }
  }, [isListening, startRecording, stopRecording])

  // Expose triggerRecord for wake word integration
  useImperativeHandle(ref, () => ({
    triggerRecord: () => {
      if (!isListening && !isDisabled && !isProcessing) {
        startRecording()
      }
    },
  }), [isListening, isDisabled, isProcessing, startRecording])

  // When the hook stops listening (e.g. due to exhausted no-speech retries),
  // clean up the timer so the UI doesn't show a running timer next to an error.
  const prevListeningRef = useRef(false)
  useEffect(() => {
    // Only clear on transition from listening → not-listening (not on mount)
    if (prevListeningRef.current && !isListening) {
      clearTimer()
    }
    prevListeningRef.current = isListening
  }, [isListening, clearTimer])

  // Keyboard shortcuts: Escape to cancel active recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return

      if (e.key === 'Escape' && isListening) {
        e.preventDefault()
        stopRecording()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isListening, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => { clearTimer() }
  }, [clearTimer])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Voice recording controls">
      <button
        onClick={toggleRecording}
        disabled={isDisabled || isProcessing}
        className={`relative p-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600'
        } ${isDisabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
        aria-pressed={isListening}
        title={isListening ? 'Tap to stop (Esc)' : 'Tap to speak'}
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" aria-hidden="true" />
            <ShankhaIcon size={20} filled className="relative z-10" />
          </>
        ) : (
          <ShankhaIcon size={20} />
        )}
      </button>

      {/* Recording duration */}
      {isListening && (
        <span className="text-xs text-red-500 font-mono animate-pulse" aria-live="off" aria-label={`Recording duration: ${formatDuration(duration)}`}>
          {formatDuration(duration)}
        </span>
      )}

      {/* STT provider badge */}
      {isListening && sttProvider && (
        <span className="text-[9px] text-white/25 bg-white/5 rounded-full px-1.5 py-0.5" aria-label={`Using ${sttProvider === 'web-speech-api' ? 'browser' : sttProvider === 'server' ? 'cloud' : sttProvider} speech recognition`}>
          {sttProvider === 'web-speech-api' ? 'Browser' : sttProvider === 'server' ? 'Cloud' : sttProvider}
        </span>
      )}

      {/* Live transcription feedback */}
      {isListening && liveTranscript && (
        <span className="text-xs text-violet-400 italic max-w-[200px] truncate" aria-live="polite">
          {liveTranscript}
        </span>
      )}

      {/* Server transcription processing indicator with progress */}
      {status === 'processing' && (
        <span className="text-xs text-violet-400 animate-pulse" role="status">
          {serverProgressMessage || 'Transcribing...'}
        </span>
      )}

      {/* Confidence badge — shown after a final result when confidence is available */}
      {!isListening && confidence > 0 && confidence < 0.6 && (
        <span className="text-[9px] text-amber-400 bg-amber-400/10 rounded-full px-1.5 py-0.5" role="status" aria-label={`Low confidence: ${Math.round(confidence * 100)}%`}>
          Low confidence ({Math.round(confidence * 100)}%)
          <button
            onClick={startRecording}
            disabled={isDisabled || isProcessing}
            className="ml-1 underline hover:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
            aria-label="Retry voice recording for better accuracy"
          >
            Retry
          </button>
        </span>
      )}

      {/* Browser does not support any speech recognition */}
      {!isSupported && !voiceError && (
        <span className="text-xs text-amber-500" role="alert">
          Voice input not supported in this browser. Please type your message.
        </span>
      )}

      {/* Error display with retry */}
      {voiceError && (
        <span className="text-xs text-amber-500 flex items-center gap-1.5" role="alert">
          {voiceError}
          {!isListening && (
            <button
              onClick={startRecording}
              disabled={isDisabled || isProcessing}
              className="underline text-violet-400 hover:text-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-400 rounded"
              aria-label="Retry voice recording"
            >
              Retry
            </button>
          )}
        </span>
      )}
    </div>
  )
})

export default CompanionVoiceRecorder
