/**
 * Wake Word Activation Overlay
 *
 * Full-screen, Siri/Alexa-inspired overlay that appears when the user
 * says the wake word ("Hey KIAAN", "Namaste KIAAN", "Hi KIAAN", etc.).
 *
 * Flow:
 * 1. Wake word detected -> overlay appears with KIAAN orb animation
 * 2. Auto-starts voice recording to capture the user's request
 * 3. Sends transcription to KIAAN API for response
 * 4. Displays and speaks KIAAN's response
 * 5. User can continue or dismiss
 *
 * Design: Dark immersive backdrop with glowing KIAAN orb, glass-morphism cards.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useGlobalWakeWord } from '@/contexts/WakeWordContext'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { apiFetch } from '@/lib/api'
import { stopAllAudio } from '@/utils/audio/universalAudioStop'

type OverlayPhase = 'listening' | 'processing' | 'responding' | 'idle'

export function WakeWordOverlay() {
  const router = useRouter()
  const {
    isActivated,
    dismissActivation,
    pause: pauseWakeWord,
    resume: resumeWakeWord,
  } = useGlobalWakeWord()

  const [phase, setPhase] = useState<OverlayPhase>('idle')
  const [userQuery, setUserQuery] = useState('')
  const [kiaanResponse, setKiaanResponse] = useState('')
  const [error, setError] = useState<string | null>(null)

  const friendEngineRef = useRef(new KiaanFriendEngine())
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable ref for handleDismiss to avoid circular dependency with useVoiceOutput
  const handleDismissRef = useRef<() => void>(() => {})

  // Voice Input - captures user speech after wake word
  const {
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    language: 'en',
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        setUserQuery(text.trim())
      }
    }, []),
    onError: useCallback((err: string) => {
      // no-speech is expected if user doesn't speak after activation
      if (err.toLowerCase().includes('no speech')) {
        setPhase('idle')
        return
      }
      setError(err)
    }, []),
  })

  // Voice Output - speaks KIAAN's response
  const {
    speak,
    cancel: cancelSpeech,
  } = useVoiceOutput({
    language: 'en',
    rate: 0.95,
    onEnd: useCallback(() => {
      // Auto-dismiss after response finishes speaking
      dismissTimerRef.current = setTimeout(() => {
        handleDismissRef.current()
      }, 3000)
    }, []),
  })

  // ─── Dismiss Handler ─────────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    cancelSpeech()
    stopListening()
    stopAllAudio()
    dismissActivation()
    resumeWakeWord()
  }, [cancelSpeech, stopListening, dismissActivation, resumeWakeWord])

  // Keep ref in sync
  handleDismissRef.current = handleDismiss

  // ─── Process Query ───────────────────────────────────────────────

  const processQuery = useCallback(async (query: string) => {
    try {
      // Try backend API first
      const response = await apiFetch('/api/voice-companion/quick-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: 'en',
          context: 'wake_word_activation',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const responseText = data.response || data.message
        if (responseText) {
          setKiaanResponse(responseText)
          setPhase('responding')
          speak(responseText)
          return
        }
      }
    } catch (err) {
      // Backend unavailable - fall through to local engine
      if (typeof console !== 'undefined') {
        console.warn('Wake word quick-response API unavailable, using local fallback:', err)
      }
    }

    // Fallback to local KIAAN Friend Engine
    try {
      const localResponse = friendEngineRef.current.processMessage(query)
      setKiaanResponse(localResponse.response)
      setPhase('responding')
      speak(localResponse.response)
    } catch (err) {
      if (typeof console !== 'undefined') {
        console.warn('Local KIAAN engine fallback failed:', err)
      }
      const fallbackMsg = "I heard you. Let me open our conversation space so we can talk properly."
      setKiaanResponse(fallbackMsg)
      setPhase('responding')
      speak(fallbackMsg)
    }
  }, [speak])

  // ─── Activation Flow ─────────────────────────────────────────────

  useEffect(() => {
    if (!isActivated) {
      // Reset state when not activated
      setPhase('idle')
      setUserQuery('')
      setKiaanResponse('')
      setError(null)
      resetTranscript()
      return
    }

    // Pause wake word detection during conversation
    pauseWakeWord()

    // Stop any currently playing audio
    stopAllAudio()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    // Start listening after a brief delay to let wake word recognition release mic
    setPhase('listening')
    const timer = setTimeout(() => {
      startListening()
    }, 400)

    return () => {
      clearTimeout(timer)
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current)
      }
    }
  }, [isActivated, pauseWakeWord, startListening, resetTranscript])

  // ─── Process user query when received ────────────────────────────

  useEffect(() => {
    if (!userQuery || phase !== 'listening') return

    setPhase('processing')
    processQuery(userQuery)
  }, [userQuery, phase, processQuery])

  // ─── Navigate to full voice companion ────────────────────────────

  const handleOpenFullCompanion = useCallback(() => {
    handleDismiss()
    router.push('/kiaan-voice-companion')
  }, [handleDismiss, router])

  // ─── Orb color based on phase ────────────────────────────────────

  const orbGradient = (() => {
    switch (phase) {
      case 'listening':
        return 'from-orange-400 via-amber-400 to-yellow-400'
      case 'processing':
        return 'from-purple-400 via-violet-400 to-indigo-400'
      case 'responding':
        return 'from-emerald-400 via-teal-400 to-cyan-400'
      default:
        return 'from-orange-400 via-amber-400 to-orange-500'
    }
  })()

  const orbGlow = (() => {
    switch (phase) {
      case 'listening':
        return 'rgba(251,191,36,0.4)'
      case 'processing':
        return 'rgba(167,139,250,0.4)'
      case 'responding':
        return 'rgba(52,211,153,0.4)'
      default:
        return 'rgba(251,146,60,0.3)'
    }
  })()

  if (!isActivated) return null

  return (
    <AnimatePresence>
      <motion.div
        key="wake-word-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss()
        }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full">

          {/* KIAAN Orb */}
          <motion.div
            className="relative"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            {/* Outer glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  `0 0 40px 10px ${orbGlow}`,
                  `0 0 80px 30px ${orbGlow}`,
                  `0 0 40px 10px ${orbGlow}`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 140, height: 140 }}
            />

            {/* Main orb */}
            <motion.div
              className={`relative h-[140px] w-[140px] rounded-full bg-gradient-to-br ${orbGradient} shadow-2xl`}
              animate={
                phase === 'listening'
                  ? {
                      scale: [1, 1.08, 1],
                    }
                  : phase === 'processing'
                  ? {
                      scale: [1, 1.05, 1],
                      rotate: [0, 3, -3, 0],
                    }
                  : {
                      scale: [1, 1.03, 1],
                    }
              }
              transition={{
                duration: phase === 'listening' ? 1.2 : phase === 'processing' ? 0.8 : 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Inner shine */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/25" />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl select-none" aria-hidden="true">
                  {phase === 'listening' ? '\uD83C\uDF99\uFE0F' : phase === 'processing' ? '\uD83D\uDD49\uFE0F' : '\uD83D\uDD4A\uFE0F'}
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Status Text */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-orange-50">
              {phase === 'listening' && 'Listening...'}
              {phase === 'processing' && 'Understanding...'}
              {phase === 'responding' && 'KIAAN'}
              {phase === 'idle' && 'KIAAN'}
            </h2>

            {/* Interim transcript while listening */}
            {phase === 'listening' && (interimTranscript || transcript) && (
              <motion.p
                className="text-sm text-orange-200/70 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                &quot;{interimTranscript || transcript}&quot;
              </motion.p>
            )}

            {/* User query display */}
            {userQuery && phase !== 'listening' && (
              <motion.p
                className="text-sm text-orange-200/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                &quot;{userQuery}&quot;
              </motion.p>
            )}
          </motion.div>

          {/* KIAAN Response Card */}
          <AnimatePresence>
            {kiaanResponse && phase === 'responding' && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full rounded-2xl border border-orange-500/20 bg-white/[0.06] p-5 backdrop-blur-sm"
              >
                <p className="text-sm leading-relaxed text-orange-50/90">
                  {kiaanResponse}
                </p>

                {/* Action to open full companion */}
                <button
                  onClick={handleOpenFullCompanion}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-4 py-2.5 text-sm font-medium text-orange-200 transition-all hover:from-orange-500/30 hover:to-amber-500/30 active:scale-[0.98]"
                >
                  Continue conversation with KIAAN
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing dots */}
          {phase === 'processing' && (
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-orange-400"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Error display */}
          {error && (
            <motion.p
              className="text-xs text-red-300/80 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          {/* Dismiss button */}
          <motion.button
            onClick={handleDismiss}
            className="mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white/80 active:scale-95"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            aria-label="Dismiss KIAAN"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default WakeWordOverlay
