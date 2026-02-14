/**
 * Global Wake Word Listener UI
 *
 * Renders a small, persistent indicator showing wake word detection status.
 * Sits in the app layout and is always visible when wake word is enabled.
 * When KIAAN is activated via wake word, opens the activation overlay.
 *
 * Visual states:
 * - Hidden: wake word disabled or unsupported
 * - Pulsing dot: actively listening for wake word
 * - Glow burst: wake word detected (briefly)
 */

'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlobalWakeWord } from '@/contexts/WakeWordContext'
import { WakeWordOverlay } from './WakeWordOverlay'

export function GlobalWakeWordListener() {
  const {
    enabled,
    isSupported,
    isListening,
    isActivated,
    isPaused,
    error,
  } = useGlobalWakeWord()

  // Play a subtle activation sound on wake word detection
  const audioRef = useRef<AudioContext | null>(null)

  // Clean up AudioContext on unmount to prevent resource leak
  useEffect(() => {
    return () => {
      if (audioRef.current && audioRef.current.state !== 'closed') {
        audioRef.current.close().catch(() => {})
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isActivated) return
    if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return

    // Play a brief chime using Web Audio API
    try {
      if (!audioRef.current || audioRef.current.state === 'closed') {
        audioRef.current = new AudioContext()
      }
      const ctx = audioRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.3)
    } catch {
      // Audio playback not critical - silently continue
    }
  }, [isActivated])

  // Don't render anything if not supported or not enabled
  if (!isSupported || !enabled) return null

  return (
    <>
      {/* Listening Indicator - fixed position, top-right area */}
      <AnimatePresence>
        {isListening && !isPaused && !isActivated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="fixed top-3 right-3 z-[100] flex items-center gap-2 rounded-full bg-slate-900/90 border border-orange-500/20 px-3 py-1.5 backdrop-blur-sm shadow-lg"
            aria-label="KIAAN is listening for wake word"
            role="status"
          >
            {/* Pulsing microphone dot */}
            <motion.div
              className="relative h-2.5 w-2.5"
              aria-hidden="true"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-orange-400"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.8, 0.4, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="absolute inset-0 rounded-full bg-orange-400" />
            </motion.div>

            <span className="text-[11px] font-medium text-orange-200/80 select-none">
              Say &quot;Hey KIAAN&quot;
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error indicator - brief toast */}
      <AnimatePresence>
        {error && enabled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 right-3 z-[100] max-w-xs rounded-xl bg-red-900/90 border border-red-500/30 px-4 py-2 backdrop-blur-sm shadow-lg"
          >
            <p className="text-xs text-red-200">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activation Overlay */}
      <WakeWordOverlay />
    </>
  )
}

export default GlobalWakeWordListener
