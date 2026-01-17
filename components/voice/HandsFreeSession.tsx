/**
 * Hands-Free Session Component
 * Complete voice conversation loop mode
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'

export interface HandsFreeSessionProps {
  language?: string
  isActive: boolean
  onUserSpeech?: (text: string) => void
  lastAssistantResponse?: string
  onExit?: () => void
}

const EXIT_PHRASES = ['stop', 'goodbye kiaan', 'exit', 'quit']

export function HandsFreeSession({
  language = 'en',
  isActive,
  onUserSpeech,
  lastAssistantResponse,
  onExit,
}: HandsFreeSessionProps) {
  const [mode, setMode] = useState<'listening' | 'speaking' | 'idle'>('idle')
  const [hasSpoken, setHasSpoken] = useState(false)

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    language,
  })

  const {
    isSpeaking,
    speak,
    cancel: cancelSpeech,
  } = useVoiceOutput({
    language,
    onEnd: () => {
      // After KIAAN speaks, auto-listen for next question
      if (isActive) {
        setMode('listening')
        setTimeout(() => {
          startListening()
        }, 500)
      }
    },
  })

  // Start listening when session becomes active
  useEffect(() => {
    if (isActive && !isListening && !isSpeaking && mode === 'idle') {
      setMode('listening')
      startListening()
    }
  }, [isActive, isListening, isSpeaking, mode, startListening])

  // Handle new assistant response - speak it
  useEffect(() => {
    if (isActive && lastAssistantResponse && !hasSpoken) {
      setMode('speaking')
      setHasSpoken(true)
      speak(lastAssistantResponse)
    }
  }, [isActive, lastAssistantResponse, hasSpoken, speak])

  // Reset hasSpoken when response changes
  useEffect(() => {
    setHasSpoken(false)
  }, [lastAssistantResponse])

  // Handle user transcript
  useEffect(() => {
    if (transcript && !isListening) {
      const normalizedTranscript = transcript.toLowerCase().trim()
      
      // Check for exit phrases
      const shouldExit = EXIT_PHRASES.some(phrase => 
        normalizedTranscript.includes(phrase)
      )

      if (shouldExit) {
        onExit?.()
        stopListening()
        cancelSpeech()
        setMode('idle')
      } else {
        // Send to parent for processing
        onUserSpeech?.(transcript)
        setMode('idle')
      }
      
      resetTranscript()
    }
  }, [transcript, isListening, onUserSpeech, onExit, resetTranscript, stopListening, cancelSpeech])

  // Cleanup on unmount or when inactive
  useEffect(() => {
    if (!isActive) {
      stopListening()
      cancelSpeech()
      setMode('idle')
      setHasSpoken(false)
    }

    return () => {
      stopListening()
      cancelSpeech()
    }
  }, [isActive, stopListening, cancelSpeech])

  if (!isActive) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hands-free-title"
    >
      <div className="relative flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl border border-orange-500/30">
        {/* Status indicator */}
        <div className="flex flex-col items-center gap-4">
          {mode === 'listening' && (
            <>
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center animate-pulse">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-slate-900"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                </div>
                <span className="absolute inset-0 rounded-full border-4 border-orange-400/50 animate-ping" />
              </div>
              <div className="text-center">
                <div id="hands-free-title" className="text-2xl font-semibold text-orange-50">Listening...</div>
                <div className="text-sm text-orange-200/70 mt-2">Speak your question</div>
              </div>
            </>
          )}

          {mode === 'speaking' && (
            <>
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center animate-pulse">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-900"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <div className="text-center">
                <div id="hands-free-title" className="text-2xl font-semibold text-orange-50">Speaking...</div>
                <div className="text-sm text-orange-200/70 mt-2">KIAAN is responding</div>
              </div>
            </>
          )}

          {mode === 'idle' && (
            <>
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                <span className="text-4xl">💬</span>
              </div>
              <div className="text-center">
                <div id="hands-free-title" className="text-2xl font-semibold text-orange-50">Processing...</div>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center max-w-md" role="status" aria-live="polite">
          <p className="text-sm text-orange-100/70">
            You&apos;re in hands-free mode. Speak naturally and KIAAN will respond with voice.
          </p>
          <p className="text-xs text-orange-100/50 mt-2">
            Say &quot;Stop&quot; or &quot;Goodbye KIAAN&quot; to exit
          </p>
        </div>

        {/* Exit button */}
        <button
          onClick={onExit}
          className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
          aria-label="Exit hands-free mode"
        >
          Exit Hands-Free Mode
        </button>
      </div>
    </div>
  )
}
