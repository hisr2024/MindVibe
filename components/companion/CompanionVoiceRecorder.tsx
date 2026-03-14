'use client'

/**
 * CompanionVoiceRecorder — Voice input for the KIAAN companion chat.
 *
 * Uses the unified useVoiceInput hook which provides the 4-tier STT fallback:
 *   Tier 1: On-device (Moonshine/Whisper)
 *   Tier 2: Web Speech API
 *   Tier 3: Server-side transcription
 *   Tier 4: Graceful "please type" message
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
  })

  // Build display text: accumulated finals + current interim
  const liveTranscript = accumulatedText
    + (accumulatedText && interimTranscript ? ' ' : '')
    + interimTranscript

  // Start recording: reset accumulated text, start timer, start listening
  const startRecording = useCallback(async () => {
    if (isDisabled || isProcessing) return
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
  }, [isDisabled, isProcessing, startListening, resetTranscript])

  // Stop recording: submit accumulated transcript
  const stopRecording = useCallback(() => {
    hookStopListening()
    clearTimer()

    if (accumulatedRef.current.trim()) {
      onTranscription(accumulatedRef.current.trim())
      accumulatedRef.current = ''
    }
    setDuration(0)
  }, [hookStopListening, clearTimer, onTranscription])

  const toggleRecording = useCallback(() => {
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
    <div className="flex items-center gap-2">
      <button
        onClick={toggleRecording}
        disabled={isDisabled || isProcessing}
        className={`relative p-3 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600'
        } ${isDisabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
        title={isListening ? 'Tap to stop' : 'Tap to speak'}
      >
        {isListening ? (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
            <ShankhaIcon size={20} filled className="relative z-10" />
          </>
        ) : (
          <ShankhaIcon size={20} />
        )}
      </button>

      {/* Recording duration */}
      {isListening && (
        <span className="text-xs text-red-500 font-mono animate-pulse">
          {formatDuration(duration)}
        </span>
      )}

      {/* Live transcription feedback */}
      {isListening && liveTranscript && (
        <span className="text-xs text-violet-400 italic max-w-[200px] truncate">
          {liveTranscript}
        </span>
      )}

      {/* Server transcription processing indicator */}
      {status === 'processing' && (
        <span className="text-xs text-violet-400 animate-pulse">
          Transcribing...
        </span>
      )}

      {/* Browser does not support any speech recognition */}
      {!isSupported && !voiceError && (
        <span className="text-xs text-amber-500">
          Voice input not supported in this browser. Please type your message.
        </span>
      )}

      {/* Error display */}
      {voiceError && (
        <span className="text-xs text-amber-500">
          {voiceError}
        </span>
      )}
    </div>
  )
})

export default CompanionVoiceRecorder
