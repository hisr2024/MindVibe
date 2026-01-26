/**
 * KiaanVoiceInput - Comprehensive voice input component for KIAAN ecosystem
 *
 * A versatile voice input component that can be used across the app:
 * - Simple microphone button mode (like VoiceInputButton)
 * - Full voice conversation mode with KIAAN wisdom
 * - Auto-save to Sacred Reflections
 * - Real-time transcription display
 * - TTS response playback
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKiaanVoice, KiaanVoiceState } from '@/hooks/useKiaanVoice'
import { useLanguage } from '@/hooks/useLanguage'

export type VoiceInputMode = 'simple' | 'conversation' | 'dictation'

export interface KiaanVoiceInputProps {
  /** Mode of operation */
  mode?: VoiceInputMode
  /** Language override (defaults to app language) */
  language?: string
  /** Callback when transcript is ready */
  onTranscript?: (text: string) => void
  /** Callback when KIAAN responds */
  onKiaanResponse?: (response: string) => void
  /** Auto-speak KIAAN responses */
  autoSpeak?: boolean
  /** Auto-save to Sacred Reflections */
  autoSaveToReflections?: boolean
  /** Show transcription overlay */
  showTranscription?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Disabled state */
  disabled?: boolean
  /** Additional CSS classes */
  className?: string
  /** Submit button text (for dictation mode) */
  submitLabel?: string
  /** Called when user wants to submit the transcription */
  onSubmit?: (text: string) => void
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
}

const iconSizes = {
  sm: 20,
  md: 24,
  lg: 32,
}

export function KiaanVoiceInput({
  mode = 'simple',
  language: languageOverride,
  onTranscript,
  onKiaanResponse,
  autoSpeak = true,
  autoSaveToReflections = false,
  showTranscription = true,
  placeholder = 'Tap to speak with KIAAN...',
  size = 'md',
  disabled = false,
  className = '',
  submitLabel = 'Send to KIAAN',
  onSubmit,
}: KiaanVoiceInputProps) {
  const { language: appLanguage } = useLanguage()
  const language = languageOverride || appLanguage || 'en'

  const [localTranscript, setLocalTranscript] = useState('')
  const [showControls, setShowControls] = useState(false)

  const {
    state,
    isListening,
    isProcessing,
    isSpeaking,
    currentTranscript,
    error,
    startListening,
    stopListening,
    stopSpeaking,
    sendToKiaan,
    saveToReflections,
    isVoiceSupported,
    isTtsSupported,
  } = useKiaanVoice({
    language,
    autoSpeak: mode === 'conversation' && autoSpeak,
    autoSaveToReflections: mode === 'conversation' && autoSaveToReflections,
    onMessage: (msg) => {
      if (msg.role === 'user') {
        onTranscript?.(msg.content)
        if (mode === 'simple' || mode === 'dictation') {
          setLocalTranscript(msg.content)
        }
      } else if (msg.role === 'kiaan') {
        onKiaanResponse?.(msg.content)
      }
    },
  })

  // Update local transcript from interim results
  useEffect(() => {
    if (currentTranscript) {
      setLocalTranscript(currentTranscript)
    }
  }, [currentTranscript])

  // Handle click
  const handleClick = useCallback(() => {
    if (disabled) return

    if (isListening) {
      stopListening()
      if (mode !== 'conversation') {
        // In simple/dictation mode, just show controls
        setShowControls(true)
      }
    } else if (isSpeaking) {
      stopSpeaking()
    } else {
      setLocalTranscript('')
      startListening()
      setShowControls(false)
    }
  }, [disabled, isListening, isSpeaking, stopListening, stopSpeaking, startListening, mode])

  // Handle submit (dictation mode)
  const handleSubmit = useCallback(async () => {
    if (!localTranscript.trim()) return

    if (onSubmit) {
      onSubmit(localTranscript.trim())
    } else if (mode === 'dictation') {
      // Send to KIAAN by default in dictation mode
      const response = await sendToKiaan(localTranscript.trim())
      if (response) {
        onKiaanResponse?.(response)
        if (autoSaveToReflections) {
          await saveToReflections(localTranscript.trim(), 'user')
          await saveToReflections(response, 'kiaan')
        }
      }
    }

    setLocalTranscript('')
    setShowControls(false)
  }, [localTranscript, onSubmit, mode, sendToKiaan, onKiaanResponse, autoSaveToReflections, saveToReflections])

  // Handle save to reflections
  const handleSaveToReflections = useCallback(async () => {
    if (localTranscript.trim()) {
      await saveToReflections(localTranscript.trim(), 'user')
      setShowControls(false)
    }
  }, [localTranscript, saveToReflections])

  // Don't render if not supported
  if (!isVoiceSupported) {
    return null
  }

  // Get state-based styling
  const getButtonStyles = () => {
    if (isListening) {
      return 'border-red-500/60 bg-red-500/20 text-red-400'
    }
    if (isProcessing) {
      return 'border-amber-500/60 bg-amber-500/20 text-amber-400'
    }
    if (isSpeaking) {
      return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
    }
    if (error) {
      return 'border-red-500/40 bg-red-500/10 text-red-400'
    }
    return 'border-orange-500/25 bg-slate-950/70 text-orange-400 hover:bg-slate-900/70 hover:border-orange-500/40'
  }

  const getStatusText = () => {
    if (isListening) return 'Listening...'
    if (isProcessing) return 'KIAAN is reflecting...'
    if (isSpeaking) return 'KIAAN is speaking...'
    if (error) return error
    return placeholder
  }

  const iconSize = iconSizes[size]

  return (
    <div className={`relative ${className}`}>
      {/* Main Button */}
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`relative flex items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${getButtonStyles()}`}
        whileTap={{ scale: 0.95 }}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {/* Microphone Icon */}
        {!isProcessing && !isSpeaking && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
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
        )}

        {/* Processing spinner */}
        {isProcessing && (
          <motion.div
            className="h-5 w-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Speaking animation */}
        {isSpeaking && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-4 bg-emerald-400 rounded-full"
                animate={{ scaleY: [1, 1.5, 1] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}

        {/* Recording pulse */}
        {isListening && (
          <motion.span
            className="absolute inset-0 rounded-2xl border-2 border-red-400/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Transcription Overlay */}
      <AnimatePresence>
        {showTranscription && (isListening || showControls || isProcessing || isSpeaking) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute left-0 top-full mt-2 z-30 min-w-[280px] max-w-[400px] rounded-xl bg-slate-900/95 border border-orange-500/30 shadow-xl backdrop-blur-sm overflow-hidden"
          >
            {/* Status Header */}
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
              isListening ? 'bg-red-500/20 text-red-300' :
              isProcessing ? 'bg-amber-500/20 text-amber-300' :
              isSpeaking ? 'bg-emerald-500/20 text-emerald-300' :
              'bg-orange-500/20 text-orange-300'
            }`}>
              {getStatusText()}
            </div>

            {/* Transcript Display */}
            {(localTranscript || currentTranscript) && (
              <div className="px-4 py-3 border-b border-orange-500/20">
                <p className="text-sm text-orange-100/90 leading-relaxed">
                  {currentTranscript || localTranscript}
                </p>
              </div>
            )}

            {/* Controls (dictation mode) */}
            {mode === 'dictation' && showControls && localTranscript && !isListening && !isProcessing && (
              <div className="px-4 py-3 flex gap-2 flex-wrap">
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-400 via-[#ff9933] to-orange-200 text-slate-950 text-sm font-semibold shadow-lg shadow-orange-500/25 hover:scale-[1.02] transition"
                >
                  {submitLabel}
                </button>
                <button
                  onClick={handleSaveToReflections}
                  className="px-4 py-2 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-100 text-sm font-medium hover:bg-orange-500/20 transition"
                >
                  Save to Reflections
                </button>
                <button
                  onClick={() => startListening()}
                  className="px-4 py-2 rounded-xl border border-orange-500/30 text-orange-100/70 text-sm hover:text-orange-100 hover:border-orange-500/50 transition"
                >
                  Re-record
                </button>
              </div>
            )}

            {/* Simple mode: auto-close hint */}
            {mode === 'simple' && isListening && (
              <div className="px-4 py-2 text-xs text-orange-100/50 text-center">
                Tap again to stop
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      {error && !isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 top-full mt-2 z-20 min-w-[200px] max-w-[300px] rounded-lg bg-red-900/95 px-3 py-2 text-xs text-red-50 shadow-lg border border-red-500/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default KiaanVoiceInput
