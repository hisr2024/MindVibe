/**
 * ChatVoiceInput — Unified Voice-to-Text Chat Input Component
 *
 * Drop-in VTT input for any MindVibe module. Combines text input with
 * voice recording, live transcription display, consent UI, and offline awareness.
 *
 * Used by: KIAAN Chat, Ardha, Viyog, Emotional Compass, Karma Reset, Emotional Reset.
 *
 * Features:
 * - One-tap mic toggle with visual recording state
 * - Live interim transcript overlay
 * - Offline indicator with graceful text fallback
 * - Consent rationale popup (privacy-first)
 * - WCAG 2.1 AA: keyboard nav, ARIA labels, screen reader announcements
 * - Confidence indicator for final results
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useVoiceToText, type VTTStatus } from '@/hooks/useVoiceToText'
import { useLanguage } from '@/hooks/useLanguage'

export interface ChatVoiceInputProps {
  /** Called with the final text (from voice or typed input) */
  onSubmit: (text: string) => void
  /** Source module for analytics tracking */
  module?: string
  /** Whether the parent is in a loading/processing state */
  disabled?: boolean
  /** Placeholder text for the text input */
  placeholder?: string
  /** Whether VTT is enabled (can be controlled externally) */
  vttEnabled?: boolean
  /** Additional CSS classes for the container */
  className?: string
}

/** Status indicator colors and labels */
const STATUS_CONFIG: Record<VTTStatus, { color: string; label: string }> = {
  idle: { color: '', label: '' },
  listening: { color: 'text-red-400', label: 'Listening...' },
  processing: { color: 'text-[#e8b54a]', label: 'Processing...' },
  error: { color: 'text-red-500', label: 'Error' },
  offline: { color: 'text-amber-500', label: 'Offline' },
}

export function ChatVoiceInput({
  onSubmit,
  module = 'unknown',
  disabled = false,
  placeholder = 'Speak from your heart...',
  vttEnabled = true,
  className = '',
}: ChatVoiceInputProps) {
  const [textInput, setTextInput] = useState('')
  const [showConsentInfo, setShowConsentInfo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { language } = useLanguage()

  const {
    status,
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    isOnline,
    error,
    confidence,
    startListening,
    stopListening,
    reset,
  } = useVoiceToText({
    language,
    module,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setTextInput(text)
        // Focus the text input so user can review/edit before sending
        inputRef.current?.focus()
      }
    },
  })

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = textInput.trim()
      if (!trimmed) return
      onSubmit(trimmed)
      setTextInput('')
      reset()
    },
    [textInput, onSubmit, reset],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Close consent popup on outside click
  useEffect(() => {
    if (!showConsentInfo) return
    const handler = () => setShowConsentInfo(false)
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handler)
    }
  }, [showConsentInfo])

  const isDenied = error?.toLowerCase().includes('denied') || error?.toLowerCase().includes('permission')
  const showMic = vttEnabled && isSupported

  const statusConfig = STATUS_CONFIG[status]

  return (
    <form
      onSubmit={handleSubmit}
      className={`border-t border-[#d4a44c]/10 px-4 py-3 ${className}`}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div
          className="mb-2 rounded-lg bg-amber-900/30 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-200/80"
          role="alert"
        >
          You are offline. Voice input is unavailable — you can still type your message.
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : placeholder}
          disabled={disabled}
          className="flex-1 rounded-2xl border border-[#d4a44c]/20 bg-[#0a0a12]/80 px-4 py-2.5 text-sm text-[#f5f0e8] outline-none focus:ring-2 focus:ring-[#d4a44c]/40 focus:border-[#d4a44c]/30 placeholder:text-[#f5f0e8]/35 transition-all disabled:opacity-50"
          aria-label="Message input — type or use voice"
        />

        {/* Mic button */}
        {showMic && (
          <div className="relative group">
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={disabled || !isOnline}
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
              {/* Mic icon */}
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

              {/* Denied slash */}
              {isDenied && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-[2px] w-6 rotate-45 bg-[#d4a44c]/70 rounded-full" />
                </span>
              )}

              {/* Recording pulse */}
              {isListening && (
                <span className="absolute inset-0 rounded-2xl border-2 border-red-400/50 animate-ping" />
              )}
            </button>

            {/* Privacy info button */}
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
                className="absolute right-0 top-full mt-2 z-30 w-[260px] rounded-xl bg-slate-900/98 px-4 py-3 shadow-xl border border-[#d4a44c]/20 backdrop-blur-md"
                role="tooltip"
              >
                <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">
                  Voice is processed locally by your browser. Audio is never sent to our
                  servers — only the final text transcript is used.
                </p>
                <p className="text-[10px] text-[#f5f0e8]/40 mt-1.5">
                  You can type instead at any time.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={!textInput.trim() || disabled}
          className="kiaan-btn-golden rounded-2xl px-5 py-2.5 text-sm font-semibold transition hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          aria-label="Send message"
        >
          Send
        </button>
      </div>

      {/* Live transcription overlay */}
      {isListening && interimTranscript && (
        <div
          className="mt-2 rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-[#f5f0e8] border border-[#d4a44c]/30 backdrop-blur-sm"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-red-400/70 animate-pulse" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-red-400/40 animate-pulse" style={{ animationDelay: '300ms' }} />
            </span>
            <span className="text-[10px] text-[#e8b54a] uppercase tracking-wider">
              {statusConfig.label}
            </span>
          </div>
          <div className="text-sm italic text-[#f5f0e8]/80 mt-1">{interimTranscript}</div>
        </div>
      )}

      {/* Confidence indicator for final results */}
      {confidence > 0 && transcript && !isListening && (
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 flex-1 max-w-[80px] rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] transition-all duration-300"
              style={{ width: `${Math.round(confidence * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#f5f0e8]/40">
            {Math.round(confidence * 100)}% confidence
          </span>
        </div>
      )}

      {/* Error display */}
      {error && !isDenied && !isListening && (
        <div
          className="mt-2 rounded-lg bg-red-900/30 border border-red-500/30 px-3 py-2 text-xs text-red-200/80"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Permission denied guidance */}
      {isDenied && (
        <div className="mt-2 rounded-lg bg-[#d4a44c]/5 border border-[#d4a44c]/20 px-3 py-2 text-xs text-[#f5f0e8]/60">
          Microphone access denied. Look for the lock icon in your address bar to allow access, or type your message instead.
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="assertive">
        {isListening ? 'Voice recording started. Speak now.' : ''}
        {transcript && !isListening ? `Transcribed: ${transcript}` : ''}
      </div>
    </form>
  )
}
