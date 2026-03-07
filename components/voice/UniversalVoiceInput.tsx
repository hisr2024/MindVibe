/**
 * Universal Voice Input Component
 *
 * A unified voice + text input component used across all MindVibe tools.
 * Wraps the existing VoiceInputButton with a text fallback, live transcription
 * display, consent rationale, and intent detection via VoiceControllerService.
 *
 * Accessibility: WCAG 2.1 AA compliant with keyboard navigation,
 * ARIA labels, screen reader announcements, and focus management.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { classifyIntent } from '@/lib/voice-controller'
import type { UserIntent } from '@/types/voice-controller.types'

export interface UniversalVoiceInputProps {
  /** Called when final transcript is received (voice or text submit) */
  onTranscript: (text: string) => void
  /** Called when intent is detected from the transcript */
  onIntentDetected?: (intent: UserIntent) => void
  /** Language code for speech recognition */
  language?: string
  /** Source module name for context tracking */
  module?: string
  /** Whether to show live transcription while speaking */
  showTranscription?: boolean
  /** Show text input fallback when mic unavailable (default: true) */
  fallbackToText?: boolean
  /** Disable the input */
  disabled?: boolean
  /** Placeholder text for the text fallback input */
  placeholder?: string
  /** Additional CSS classes */
  className?: string
}

export function UniversalVoiceInput({
  onTranscript,
  onIntentDetected,
  language = 'en',
  module = 'unknown',
  showTranscription = true,
  fallbackToText = true,
  disabled = false,
  placeholder = 'Type or speak your message...',
  className = '',
}: UniversalVoiceInputProps) {
  const [textInput, setTextInput] = useState('')
  const [showConsentInfo, setShowConsentInfo] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)

  const {
    isListening,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
  } = useVoiceInput({
    language,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        onTranscript(text)
        if (onIntentDetected) {
          const intent = classifyIntent(text)
          onIntentDetected(intent)
        }
      }
    },
  })

  const isDenied = error?.toLowerCase().includes('denied') || error?.toLowerCase().includes('permission')

  // Handle text submit
  const handleTextSubmit = useCallback(() => {
    const trimmed = textInput.trim()
    if (!trimmed) return

    onTranscript(trimmed)
    if (onIntentDetected) {
      const intent = classifyIntent(trimmed)
      onIntentDetected(intent)
    }
    setTextInput('')
  }, [textInput, onTranscript, onIntentDetected])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleTextSubmit()
      }
    },
    [handleTextSubmit],
  )

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Close consent info when clicking outside
  useEffect(() => {
    if (!showConsentInfo) return
    const handler = () => {
      setShowConsentInfo(false)
    }
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handler)
    }
  }, [showConsentInfo])

  const showTextFallback = fallbackToText && (!isSupported || isDenied)

  return (
    <div
      className={`relative flex items-center gap-2 ${className}`}
      role="search"
      aria-label={`Voice and text input for ${module}`}
    >
      {/* Mic Button */}
      {isSupported && (
        <div className="relative">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDenied
                ? 'border-[#d4a44c]/40 bg-[#d4a44c]/10 text-[#d4a44c]'
                : isListening
                ? 'border-red-500/60 bg-red-500/20 text-red-400 animate-pulse'
                : 'border-[#d4a44c]/25 bg-slate-950/70 text-[#d4a44c] hover:bg-slate-900/70 hover:border-[#d4a44c]/40'
            }`}
            aria-label={
              isDenied
                ? 'Microphone access denied — click for instructions'
                : isListening
                ? 'Stop recording'
                : 'Start voice input'
            }
          >
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

            {isDenied && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-[2px] w-6 rotate-45 bg-[#d4a44c]/70 rounded-full" />
              </span>
            )}

            {isListening && (
              <span className="absolute inset-0 rounded-2xl border-2 border-red-400/50 animate-ping" />
            )}
          </button>

          {/* Consent info button */}
          {!isListening && !isDenied && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowConsentInfo(!showConsentInfo)
              }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-slate-800 border border-[#d4a44c]/20 flex items-center justify-center text-[8px] text-[#d4a44c]/60 hover:text-[#d4a44c] transition-colors"
              aria-label="Voice privacy information"
            >
              ?
            </button>
          )}

          {/* Consent rationale popup */}
          {showConsentInfo && (
            <div
              className="absolute left-0 top-full mt-2 z-30 w-[260px] rounded-xl bg-slate-900/98 px-4 py-3 shadow-xl border border-[#d4a44c]/20 backdrop-blur-md"
              role="tooltip"
            >
              <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">
                Voice is processed locally by your browser. Audio is never sent to our servers — only the
                final text transcript is used.
              </p>
              <p className="text-[10px] text-[#f5f0e8]/40 mt-1.5">
                You can type instead at any time.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text Input Fallback */}
      {(showTextFallback || fallbackToText) && (
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={textInputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              isListening
                ? 'Listening...'
                : !isSupported
                ? placeholder
                : placeholder
            }
            className="flex-1 h-10 rounded-xl bg-black/40 border border-[#d4a44c]/10 text-[#f5f0e8]/90 placeholder:text-[#d4a44c]/20 px-3 text-sm focus:ring-1 focus:ring-[#d4a44c]/30 focus:border-[#d4a44c]/20 outline-none transition-all disabled:opacity-50"
            aria-label="Text input fallback"
          />
          {textInput.trim() && (
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={disabled}
              className="h-10 px-3 rounded-xl bg-[#d4a44c]/20 border border-[#d4a44c]/20 text-[#d4a44c] text-sm font-medium hover:bg-[#d4a44c]/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 disabled:opacity-50"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Live Transcription Display */}
      {showTranscription && isListening && interimTranscript && (
        <div
          className="absolute left-0 top-full mt-2 z-20 min-w-[200px] max-w-[300px] rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-[#f5f0e8] shadow-lg border border-[#d4a44c]/30 backdrop-blur-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="text-[10px] text-[#e8b54a] mb-1 uppercase tracking-wider">
            Listening...
          </div>
          <div className="text-sm italic text-[#f5f0e8]/80">{interimTranscript}</div>
        </div>
      )}

      {/* Error display */}
      {error && !isDenied && !isListening && (
        <div
          className="absolute left-0 top-full mt-2 z-20 min-w-[200px] max-w-[300px] rounded-lg bg-red-900/90 px-3 py-2 text-xs text-red-50 shadow-lg border border-red-500/50 backdrop-blur-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Permission denied message */}
      {isDenied && (
        <p className="text-[11px] text-[#d4a44c]/60">
          Mic access denied. Use text input instead.
        </p>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="assertive">
        {isListening ? 'Voice recording started. Speak now.' : ''}
      </div>
    </div>
  )
}
