'use client'

/**
 * KiaanVoiceFAB - Global Floating Action Button for Voice Access
 *
 * A persistent, always-visible floating button that provides instant
 * voice access to KIAAN from any page in the app. Inspired by
 * Siri's compact activation orb and Google Assistant's FAB.
 *
 * Features:
 * - Always visible on every page (bottom-right corner)
 * - Tap to speak to KIAAN instantly
 * - Shows wake word listening status
 * - Animated orb with emotion-aware gradients
 * - Expandable mini-response card
 * - Navigates to full voice companion on long press
 * - Respects prefers-reduced-motion
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useKiaanVoice } from '@/hooks/useKiaanVoice'
import { useGlobalWakeWord } from '@/contexts/WakeWordContext'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { apiFetch } from '@/lib/api'

type FABState = 'idle' | 'listening' | 'processing' | 'responding'

export default function KiaanVoiceFAB() {
  const router = useRouter()
  const [fabState, setFabState] = useState<FABState>('idle')
  const [response, setResponse] = useState('')
  const [showResponse, setShowResponse] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const { isListening: wakeWordListening, enabled: wakeWordEnabled } = useGlobalWakeWord()
  const friendEngineRef = useRef(new KiaanFriendEngine())
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable ref for processQuery to break circular dependency with useKiaanVoice
  const processQueryRef = useRef<(query: string) => void>(() => {})

  const {
    speak,
    startListening,
    stopListening,
    stopAll,
    isSpeaking,
    isListening,
    isSupported,
    transcript,
    interimTranscript,
  } = useKiaanVoice({
    onTranscript: useCallback((text: string) => {
      setFabState('processing')
      processQueryRef.current(text)
    }, []),
    onSpeakEnd: useCallback(() => {
      dismissTimerRef.current = setTimeout(() => {
        setShowResponse(false)
        setFabState('idle')
        setResponse('')
      }, 4000)
    }, []),
  })

  // Accessibility: subscribe to reduced motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const processQuery = useCallback(async (query: string) => {
    try {
      const res = await apiFetch('/api/voice-companion/quick-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: 'fab_voice_activation',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const responseText = data.response || data.message
        if (responseText) {
          setResponse(responseText)
          setShowResponse(true)
          setFabState('responding')
          speak(responseText)
          return
        }
      }
    } catch {
      // Backend unavailable
    }

    // Local fallback
    try {
      const local = friendEngineRef.current.processMessage(query)
      setResponse(local.response)
      setShowResponse(true)
      setFabState('responding')
      speak(local.response)
    } catch {
      const fallback = 'I heard you. Tap to open our full conversation.'
      setResponse(fallback)
      setShowResponse(true)
      setFabState('responding')
      speak(fallback)
    }
  }, [speak])

  // Keep processQueryRef in sync with latest processQuery
  useEffect(() => {
    processQueryRef.current = processQuery
  }, [processQuery])

  const handleTap = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }

    if (fabState === 'listening' || isListening) {
      stopListening()
      setFabState('idle')
      return
    }

    if (fabState === 'responding' || isSpeaking) {
      stopAll()
      setShowResponse(false)
      setFabState('idle')
      setResponse('')
      return
    }

    // Start listening
    setFabState('listening')
    setResponse('')
    setShowResponse(false)
    startListening()
  }, [fabState, isListening, isSpeaking, startListening, stopListening, stopAll])

  const handleLongPressStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      stopAll()
      router.push('/kiaan-voice-companion')
    }, 800)
  }, [router, stopAll])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  if (!isSupported) return null

  // Gradient colors based on state
  const gradientFrom = fabState === 'listening' ? '#d4a44c' :
    fabState === 'processing' ? '#8b5cf6' :
    fabState === 'responding' ? '#10b981' :
    wakeWordListening ? '#10b981' : '#c8943a'

  const gradientTo = fabState === 'listening' ? '#f0c96d' :
    fabState === 'processing' ? '#6366f1' :
    fabState === 'responding' ? '#06b6d4' :
    wakeWordListening ? '#34d399' : '#e8b54a'

  return (
    <>
      {/* Response card (above the FAB) */}
      <AnimatePresence>
        {showResponse && response && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-[calc(156px+env(safe-area-inset-bottom,0px))] md:bottom-24 right-4 z-[150] max-w-xs w-72"
          >
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#0a0a12]/95 p-4 backdrop-blur-xl shadow-2xl">
              {/* Transcript */}
              {transcript && (
                <p className="text-xs text-[#d4a44c]/50 mb-2 italic truncate">
                  &quot;{transcript}&quot;
                </p>
              )}
              {/* Response */}
              <p className="text-sm leading-relaxed text-[#f5f0e8]/90 line-clamp-4">
                {response}
              </p>
              {/* Open full companion */}
              <button
                onClick={() => {
                  stopAll()
                  setShowResponse(false)
                  setFabState('idle')
                  router.push('/kiaan-voice-companion')
                }}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#d4a44c]/15 to-[#e8b54a]/15 border border-[#d4a44c]/20 px-3 py-2 text-xs font-medium text-[#e8b54a]/80 transition-all hover:from-[#d4a44c]/25 hover:to-[#e8b54a]/25 active:scale-[0.98]"
              >
                Continue with KIAAN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim transcript bubble */}
      <AnimatePresence>
        {fabState === 'listening' && (interimTranscript || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-[calc(156px+env(safe-area-inset-bottom,0px))] md:bottom-24 right-4 z-[150]"
          >
            <div className="rounded-xl bg-slate-900/90 px-3 py-2 backdrop-blur-md border border-white/10 max-w-xs">
              <p className="text-xs text-[#d4a44c]/70 italic truncate">
                {interimTranscript || transcript}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={handleTap}
        onPointerDown={handleLongPressStart}
        onPointerUp={handleLongPressEnd}
        onPointerCancel={handleLongPressEnd}
        className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-4 z-[140] md:bottom-8 flex items-center justify-center rounded-full shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507]"
        style={{ width: 56, height: 56 }}
        whileTap={{ scale: 0.92 }}
        aria-label={
          fabState === 'listening' ? 'Stop listening' :
          fabState === 'responding' ? 'Stop KIAAN' :
          'Talk to KIAAN'
        }
      >
        {/* Outer glow ring */}
        {fabState !== 'idle' && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                `0 0 15px 4px ${gradientFrom}40`,
                `0 0 30px 10px ${gradientFrom}30`,
                `0 0 15px 4px ${gradientFrom}40`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Wake word listening indicator (subtle green ring) */}
        {wakeWordEnabled && wakeWordListening && fabState === 'idle' && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-[-3px] rounded-full border-2 border-emerald-400/30"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Main orb */}
        <div
          className="relative h-full w-full rounded-full shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          {/* Glass highlight */}
          <div
            className="absolute rounded-full"
            style={{
              top: '10%', left: '15%', width: '40%', height: '30%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '50%',
            }}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            {fabState === 'listening' ? (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : fabState === 'processing' ? (
              <motion.svg
                width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32 32" />
              </motion.svg>
            ) : fabState === 'responding' ? (
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            ) : (
              /* Idle: KIAAN mic/orb icon */
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="opacity-90">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </div>
        </div>

        {/* Processing dots */}
        {fabState === 'processing' && !prefersReducedMotion && (
          <div className="absolute -top-1 -right-1 flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-violet-300"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}
      </motion.button>
    </>
  )
}
