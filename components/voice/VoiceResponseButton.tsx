/**
 * VoiceResponseButton - Text-to-Speech button for KIAAN responses
 *
 * Plays KIAAN responses with natural voice synthesis.
 * Features:
 * - Play/Pause/Stop controls
 * - Backend TTS with neural voices (with browser fallback)
 * - Natural voice with adjustable rate
 * - Visual feedback during playback
 * - Multi-language support
 */

'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { useEnhancedVoiceOutput } from '@/hooks/useEnhancedVoiceOutput'
import { useLanguage } from '@/hooks/useLanguage'

export interface VoiceResponseButtonProps {
  /** Text to speak */
  text: string
  /** Language override */
  language?: string
  /** Speech rate (0.5 - 2.0, default 0.95 for natural sound) */
  rate?: number
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Variant style */
  variant?: 'default' | 'minimal' | 'accent'
  /** Additional CSS classes */
  className?: string
  /** Called when speech starts */
  onStart?: () => void
  /** Called when speech ends */
  onEnd?: () => void
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 22,
}

export function VoiceResponseButton({
  text,
  language: languageOverride,
  rate = 0.95,
  size = 'md',
  variant = 'default',
  className = '',
  onStart,
  onEnd,
}: VoiceResponseButtonProps) {
  const { language: appLanguage } = useLanguage()
  const language = languageOverride || appLanguage || 'en'

  const {
    isSpeaking,
    isPaused,
    isLoading,
    isSupported,
    speak,
    pause,
    resume,
    cancel,
  } = useEnhancedVoiceOutput({
    language,
    rate,
    voiceType: 'friendly',
    useBackendTts: true,
    onStart,
    onEnd,
  })

  const handleClick = useCallback(async () => {
    if (isLoading) return

    if (isSpeaking) {
      if (isPaused) {
        resume()
      } else {
        pause()
      }
    } else {
      await speak(text)
    }
  }, [isSpeaking, isPaused, isLoading, speak, pause, resume, text])

  const handleStop = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    cancel()
  }, [cancel])

  if (!isSupported) {
    return null
  }

  const iconSize = iconSizes[size]

  const getVariantStyles = () => {
    if (isSpeaking) {
      return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
    }

    switch (variant) {
      case 'minimal':
        return 'border-transparent bg-transparent text-orange-400 hover:bg-orange-500/10'
      case 'accent':
        return 'border-orange-400/40 bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 hover:from-orange-500/30 hover:to-amber-500/30'
      default:
        return 'border-orange-500/25 bg-slate-950/70 text-orange-400 hover:bg-slate-900/70 hover:border-orange-500/40'
    }
  }

  return (
    <div className={`relative inline-flex items-center gap-1 ${className}`}>
      {/* Main Play/Pause Button */}
      <motion.button
        type="button"
        onClick={handleClick}
        className={`relative flex items-center justify-center rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${sizeClasses[size]} ${getVariantStyles()}`}
        whileTap={{ scale: 0.95 }}
        aria-label={isLoading ? 'Loading' : isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Listen'}
        title={isLoading ? 'Loading voice...' : isSpeaking ? (isPaused ? 'Resume speaking' : 'Pause speaking') : 'Listen to response'}
      >
        {isLoading && (
          // Loading spinner
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </motion.svg>
        )}

        {!isSpeaking && !isLoading && (
          // Play/Speaker icon
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
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}

        {isSpeaking && !isPaused && (
          // Pause icon
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
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        )}

        {isSpeaking && isPaused && (
          // Play icon
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
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}

        {/* Speaking animation */}
        {isSpeaking && !isPaused && (
          <motion.span
            className="absolute inset-0 rounded-xl border-2 border-emerald-400/50"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Stop Button (only shown when speaking) */}
      {isSpeaking && (
        <motion.button
          type="button"
          onClick={handleStop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`flex items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 ${sizeClasses[size]}`}
          aria-label="Stop"
          title="Stop speaking"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </motion.button>
      )}
    </div>
  )
}

export default VoiceResponseButton
