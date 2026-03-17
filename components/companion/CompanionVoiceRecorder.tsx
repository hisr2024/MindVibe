'use client'

/**
 * CompanionVoiceRecorder — Siri/Alexa-like Voice Input for KIAAN Companion
 *
 * Replaced the old tap-to-record model with real-time streaming speech recognition:
 * - VAD (Voice Activity Detection) auto-detects speech start/end
 * - Web Speech API streams interim transcripts as user speaks (words appear live)
 * - Auto-submits after 1.5s of silence (no manual stop needed)
 * - Wake word detection ("Hey KIAAN") for hands-free activation
 * - Single tap activates/deactivates listening mode
 *
 * How it works (like Siri):
 *   Tap Shankha → VAD + STT start simultaneously → user speaks →
 *   words appear in real-time → user stops → 1.5s silence → auto-submit →
 *   KIAAN responds → resume listening (conversational mode)
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { ShankhaIcon } from '@/components/icons/ShankhaIcon'
import { useHandsFreeMode } from '@/hooks/useHandsFreeMode'
import { useWakeWord } from '@/hooks/useWakeWord'

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

  const mountedRef = useRef(true)

  // Hands-free mode: VAD + real-time streaming STT
  const {
    isActive,
    state,
    activate,
    deactivate,
    transcript,
    interimTranscript,
    confidence,
    sttProvider,
    error: handsFreeError,
    vadSupported,
  } = useHandsFreeMode({
    language,
    onTranscript: useCallback((text: string) => {
      if (mountedRef.current && text.trim()) {
        onTranscription(text.trim())
      }
    }, [onTranscription]),
    conversational: true,
    isProcessing,
  })

  // Wake word detection: "Hey KIAAN"
  const {
    isListening: isWakeWordListening,
    startWakeWordListening,
    stopWakeWordListening,
    wakeWordSupported,
    lastDetected: lastWakeWord,
  } = useWakeWord({
    language,
    onWakeWordDetected: useCallback(() => {
      if (!isActive && !isDisabled && !isProcessing) {
        activate()
      }
    }, [isActive, isDisabled, isProcessing, activate]),
  })

  // Toggle hands-free mode
  const toggleHandsFree = useCallback(() => {
    if (isDisabled || isProcessing) return
    if (isActive) {
      deactivate()
    } else {
      // Stop wake word before activating (avoid two SpeechRecognition instances)
      if (isWakeWordListening) {
        stopWakeWordListening()
      }
      activate()
    }
  }, [isActive, isDisabled, isProcessing, activate, deactivate, isWakeWordListening, stopWakeWordListening])

  // Toggle wake word listening
  const toggleWakeWord = useCallback(() => {
    if (isWakeWordListening) {
      stopWakeWordListening()
    } else if (!isActive) {
      startWakeWordListening()
    }
  }, [isWakeWordListening, isActive, startWakeWordListening, stopWakeWordListening])

  // Expose triggerRecord for programmatic activation
  useImperativeHandle(ref, () => ({
    triggerRecord: () => {
      if (!isActive && !isDisabled && !isProcessing) {
        activate()
      }
    },
  }), [isActive, isDisabled, isProcessing, activate])

  // Resume wake word listening after hands-free deactivates
  useEffect(() => {
    if (!isActive && wakeWordSupported && !isWakeWordListening) {
      // Could auto-resume wake word here if user had it enabled
    }
  }, [isActive, wakeWordSupported, isWakeWordListening])

  // Keyboard: Escape to deactivate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.key === 'Escape' && isActive) {
        e.preventDefault()
        deactivate()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, deactivate])

  // Cleanup on unmount
  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // Build live transcript display
  const liveText = transcript
    + (transcript && interimTranscript ? ' ' : '')
    + interimTranscript

  // Determine visual state
  const isHearing = state === 'hearing'
  const isWaiting = state === 'waiting'
  const isSubmitting = state === 'submitting'

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Voice input controls">
      {/* Main Shankha button — activates/deactivates hands-free mode */}
      <button
        onClick={toggleHandsFree}
        disabled={isDisabled || isProcessing}
        className={`relative p-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
          isHearing
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110'
            : isWaiting
            ? 'bg-violet-600/80 text-white shadow-lg shadow-violet-500/20 scale-105'
            : isSubmitting
            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600'
        } ${isDisabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-label={isActive ? 'Stop listening' : 'Start voice input'}
        aria-pressed={isActive}
        title={isActive ? 'Tap to stop listening (Esc)' : 'Tap to start listening'}
      >
        {isHearing ? (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" aria-hidden="true" />
            <ShankhaIcon size={20} filled className="relative z-10" />
          </>
        ) : isWaiting ? (
          <>
            <span className="absolute inset-0 rounded-full bg-violet-500 animate-pulse opacity-20" aria-hidden="true" />
            <ShankhaIcon size={20} filled className="relative z-10" />
          </>
        ) : (
          <ShankhaIcon size={20} />
        )}
      </button>

      {/* Listening state indicator */}
      {isWaiting && !liveText && (
        <span className="text-xs text-violet-400 animate-pulse" role="status">
          Listening...
        </span>
      )}

      {/* Live transcript — words appearing in real-time like Siri */}
      {isActive && liveText && (
        <span className="text-xs text-violet-400 italic max-w-[250px] truncate" aria-live="polite">
          {liveText}
        </span>
      )}

      {/* Submitting indicator */}
      {isSubmitting && (
        <span className="text-xs text-green-400" role="status">
          Sending...
        </span>
      )}

      {/* STT provider badge */}
      {isActive && sttProvider && sttProvider !== 'none' && (
        <span className="text-[9px] text-white/25 bg-white/5 rounded-full px-1.5 py-0.5" aria-label={`Using ${sttProvider === 'web-speech-api' ? 'browser' : sttProvider === 'server' ? 'cloud' : sttProvider} speech recognition`}>
          {sttProvider === 'web-speech-api' ? 'Browser' : sttProvider === 'server' ? 'Cloud' : sttProvider}
        </span>
      )}

      {/* Wake word toggle */}
      {wakeWordSupported && !isActive && (
        <button
          onClick={toggleWakeWord}
          className={`text-[10px] rounded-full px-2 py-0.5 transition-all focus:outline-none focus:ring-1 focus:ring-violet-400 ${
            isWakeWordListening
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/10'
          }`}
          aria-label={isWakeWordListening ? 'Disable Hey KIAAN' : 'Enable Hey KIAAN'}
          title={isWakeWordListening ? 'Wake word active — say "Hey KIAAN"' : 'Enable wake word detection'}
        >
          {isWakeWordListening ? '🎙 Hey KIAAN' : 'Hey KIAAN'}
        </button>
      )}

      {/* Wake word detected indicator */}
      {lastWakeWord && (
        <span className="text-[9px] text-violet-400 animate-pulse">
          Heard: &quot;{lastWakeWord}&quot;
        </span>
      )}

      {/* Confidence badge — shown after a result when confidence is low */}
      {!isActive && confidence > 0 && confidence < 0.6 && (
        <span className="text-[9px] text-amber-400 bg-amber-400/10 rounded-full px-1.5 py-0.5" role="status" aria-label={`Low confidence: ${Math.round(confidence * 100)}%`}>
          Low confidence ({Math.round(confidence * 100)}%)
          <button
            onClick={toggleHandsFree}
            disabled={isDisabled || isProcessing}
            className="ml-1 underline hover:text-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
            aria-label="Retry voice input"
          >
            Retry
          </button>
        </span>
      )}

      {/* VAD not supported message */}
      {!vadSupported && !isActive && (
        <span className="text-[9px] text-amber-500/60" role="status">
          Voice detection limited in this browser
        </span>
      )}

      {/* Error display */}
      {handsFreeError && (
        <span className="text-xs text-amber-500 flex items-center gap-1.5" role="alert">
          {handsFreeError}
          {!isActive && (
            <button
              onClick={toggleHandsFree}
              disabled={isDisabled || isProcessing}
              className="underline text-violet-400 hover:text-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-400 rounded"
              aria-label="Retry voice input"
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
