/**
 * Voice Input Button Component
 *
 * Microphone button for speech-to-text in chat input.
 * Handles permission states gracefully — shows a friendly prompt
 * when mic access is denied or not yet granted.
 */

'use client'

import { useEffect, useState } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

export interface VoiceInputButtonProps {
  language?: string
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

type MicPermission = 'prompt' | 'granted' | 'denied' | 'unknown'

export function VoiceInputButton({
  language = 'en',
  onTranscript,
  onError,
  disabled = false,
  className = '',
}: VoiceInputButtonProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    language,
    onError,
  })

  const [micPermission, setMicPermission] = useState<MicPermission>('unknown')
  const [showPermissionHint, setShowPermissionHint] = useState(false)

  // Check microphone permission status on mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      setMicPermission('unknown')
      return
    }

    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((status) => {
      setMicPermission(status.state as MicPermission)
      status.onchange = () => {
        setMicPermission(status.state as MicPermission)
        if (status.state === 'granted') setShowPermissionHint(false)
      }
    }).catch(() => {
      setMicPermission('unknown')
    })
  }, [])

  // Send final transcript to parent
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript?.(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, onTranscript, resetTranscript])

  // Detect denial from error message
  useEffect(() => {
    if (error && (error.toLowerCase().includes('denied') || error.toLowerCase().includes('permission') || error.toLowerCase().includes('not-allowed'))) {
      setMicPermission('denied')
      setShowPermissionHint(true)
    }
  }, [error])

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      if (micPermission === 'denied') {
        setShowPermissionHint(true)
        return
      }
      startListening()
    }
  }

  const isDenied = micPermission === 'denied'

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 disabled:opacity-50 disabled:cursor-not-allowed ${
          isDenied
            ? 'border-[#d4a44c]/40 bg-[#d4a44c]/10 text-[#d4a44c]'
            : isListening
            ? 'border-red-500/60 bg-red-500/20 text-red-400 animate-pulse'
            : 'border-[#d4a44c]/25 bg-slate-950/70 text-[#d4a44c] hover:bg-slate-900/70 hover:border-[#d4a44c]/40'
        } ${className}`}
        aria-label={
          isDenied
            ? 'Microphone access denied — click for instructions'
            : isListening
            ? 'Stop recording'
            : 'Start voice input'
        }
        title={
          isDenied
            ? 'Microphone permission needed'
            : isListening
            ? 'Click to stop recording'
            : 'Click to start voice input'
        }
      >
        {/* Microphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isListening ? 'scale-110' : ''}
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>

        {/* Denied slash indicator */}
        {isDenied && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-[2px] w-6 rotate-45 bg-[#d4a44c]/70 rounded-full" />
          </span>
        )}

        {/* Recording indicator pulse */}
        {isListening && (
          <span className="absolute inset-0 rounded-2xl border-2 border-red-400/50 animate-ping" />
        )}
      </button>

      {/* Live transcription display */}
      {isListening && interimTranscript && (
        <div className="absolute left-0 top-full mt-2 z-20 min-w-[200px] max-w-[300px] rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-[#f5f0e8] shadow-lg border border-[#d4a44c]/30 backdrop-blur-sm">
          <div className="text-[10px] text-[#e8b54a] mb-1 uppercase tracking-wider">Listening...</div>
          <div className="text-sm italic text-[#f5f0e8]/80">{interimTranscript}</div>
        </div>
      )}

      {/* Permission denied guidance */}
      {showPermissionHint && isDenied && !isListening && (
        <div className="absolute right-0 top-full mt-2 z-30 w-[280px] rounded-xl bg-slate-900/98 px-4 py-3 shadow-xl border border-[#d4a44c]/30 backdrop-blur-md">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-[#d4a44c] flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </span>
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-medium text-[#f5f0e8]">Microphone access needed</p>
              <p className="text-[11px] text-[#f5f0e8]/70 leading-relaxed">
                To use voice input, allow microphone access in your browser settings. Look for the lock or camera icon in your address bar.
              </p>
              <p className="text-[10px] text-[#f5f0e8]/50">Your audio is processed locally — never stored.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPermissionHint(false)}
            className="absolute top-2 right-2 text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70 transition-colors"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Error display (non-permission errors) */}
      {error && !isDenied && !isListening && (
        <div className="absolute left-0 top-full mt-2 z-20 min-w-[200px] max-w-[300px] rounded-lg bg-red-900/95 px-3 py-2 text-xs text-red-50 shadow-lg border border-red-500/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Permission hint on hover (when permission is prompt/unknown) */}
      {!isListening && !error && !isDenied && micPermission !== 'granted' && (
        <div className="absolute right-0 top-full mt-2 z-20 min-w-[200px] max-w-[280px] rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-[#f5f0e8]/70 shadow-lg border border-[#d4a44c]/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Click to speak. Your browser will ask for microphone permission. Audio is processed locally.
        </div>
      )}
    </div>
  )
}
