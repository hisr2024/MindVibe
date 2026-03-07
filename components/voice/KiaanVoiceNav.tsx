/**
 * KIAAN Voice Navigation FAB
 *
 * A persistent floating action button that enables voice-driven navigation
 * across the MindVibe ecosystem. Users can tap to speak commands like
 * "Take me to Ardha" or "I feel guilty" and get routed to the right tool.
 *
 * Complements the existing KiaanVoiceFAB by focusing on navigation/intent
 * rather than full voice conversations.
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { classifyIntent, resolveRoute, executeIntent } from '@/lib/voice-controller'
import type { UserIntent, VoiceControllerResult } from '@/types/voice-controller.types'

type NavState = 'idle' | 'listening' | 'processing' | 'result'

export function KiaanVoiceNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<NavState>('idle')
  const [result, setResult] = useState<VoiceControllerResult | null>(null)
  const [textInput, setTextInput] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    isListening,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceInput({
    language: typeof window !== 'undefined'
      ? localStorage.getItem('preferredLocale') || 'en'
      : 'en',
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        handleTranscript(text)
      }
    },
  })

  // Sync listening state
  useEffect(() => {
    if (isListening) {
      setState('listening')
    }
  }, [isListening])

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current)
    }
  }, [])

  const handleTranscript = useCallback(
    async (text: string) => {
      setState('processing')
      try {
        const intent = classifyIntent(text)
        const execResult = await executeIntent(intent)
        setResult(execResult)
        setState('result')

        // Navigate if route is resolved and different from current
        if (execResult.route && execResult.intent.action === 'navigate') {
          const targetRoute = execResult.route
          if (targetRoute !== pathname) {
            // Brief delay so user sees the result
            resultTimeoutRef.current = setTimeout(() => {
              router.push(targetRoute)
              setState('idle')
              setResult(null)
            }, 1200)
          }
        } else {
          // Auto-dismiss result after 4 seconds
          resultTimeoutRef.current = setTimeout(() => {
            setState('idle')
            setResult(null)
          }, 4000)
        }
      } catch {
        setState('idle')
        setResult(null)
      }
    },
    [pathname, router],
  )

  const handleTextSubmit = useCallback(() => {
    const trimmed = textInput.trim()
    if (!trimmed) return
    setTextInput('')
    setShowTextInput(false)
    handleTranscript(trimmed)
  }, [textInput, handleTranscript])

  const handleMicClick = useCallback(() => {
    if (state === 'listening') {
      stopListening()
      setState('idle')
    } else if (state === 'result') {
      // Dismiss result
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current)
      setState('idle')
      setResult(null)
    } else {
      if (isSupported) {
        startListening()
      } else {
        setShowTextInput(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }, [state, isSupported, startListening, stopListening])

  // Don't render on mobile companion page (KiaanVoiceFAB already there)
  if (pathname === '/companion' || pathname?.startsWith('/m/')) {
    return null
  }

  const stateColors = {
    idle: 'from-[#d4a44c]/80 to-[#e8b54a]/80',
    listening: 'from-red-500/80 to-red-400/80',
    processing: 'from-blue-500/80 to-blue-400/80',
    result: 'from-emerald-500/80 to-emerald-400/80',
  }

  return (
    <div className="fixed bottom-24 left-4 z-[130] flex flex-col items-start gap-2">
      {/* Result bubble */}
      {state === 'result' && result?.response && (
        <div className="max-w-[280px] rounded-xl bg-slate-900/95 px-4 py-3 text-xs text-[#f5f0e8] shadow-xl border border-[#d4a44c]/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-[#f5f0e8]/90 leading-relaxed">{result.response}</p>
          {result.suggestedFollowUp && (
            <p className="text-[#d4a44c]/60 mt-1.5 text-[10px]">{result.suggestedFollowUp}</p>
          )}
        </div>
      )}

      {/* Interim transcript */}
      {state === 'listening' && interimTranscript && (
        <div className="max-w-[250px] rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-[#f5f0e8]/80 shadow-lg border border-red-500/20 backdrop-blur-sm">
          <span className="text-[10px] text-red-400 uppercase tracking-wider block mb-0.5">
            Listening...
          </span>
          <span className="italic">{interimTranscript}</span>
        </div>
      )}

      {/* Text input */}
      {showTextInput && (
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-900/95 border border-[#d4a44c]/20 px-2 py-1.5 shadow-xl backdrop-blur-md">
          <input
            ref={inputRef}
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit()
              if (e.key === 'Escape') setShowTextInput(false)
            }}
            placeholder="Where to?"
            className="w-[160px] h-8 bg-transparent text-[#f5f0e8] text-xs placeholder:text-[#d4a44c]/30 outline-none"
            aria-label="Navigation command"
          />
          <button
            type="button"
            onClick={handleTextSubmit}
            className="h-7 w-7 rounded-lg bg-[#d4a44c]/20 flex items-center justify-center text-[#d4a44c] hover:bg-[#d4a44c]/30 transition-colors"
            aria-label="Go"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* FAB Button */}
      <button
        type="button"
        onClick={handleMicClick}
        className={`h-12 w-12 rounded-full bg-gradient-to-br ${stateColors[state]} shadow-lg shadow-black/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50`}
        aria-label={
          state === 'listening'
            ? 'Stop listening'
            : state === 'result'
            ? 'Dismiss result'
            : 'Voice navigation — tap to speak a command'
        }
        title={
          state === 'listening'
            ? 'Tap to stop'
            : 'Tap to navigate by voice'
        }
      >
        {state === 'listening' ? (
          /* Stop icon */
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : state === 'processing' ? (
          /* Spinner */
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white animate-spin">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ) : (
          /* Compass/nav icon */
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        )}

        {/* Listening pulse */}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" />
        )}
      </button>
    </div>
  )
}
