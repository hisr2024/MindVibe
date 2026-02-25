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

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGlobalWakeWord } from '@/contexts/WakeWordContext'
import { WakeWordOverlay } from './WakeWordOverlay'
import { playSynthSound } from '@/utils/audio/webAudioSounds'

export function GlobalWakeWordListener() {
  const {
    enabled,
    isSupported,
    isListening,
    isActivated,
    isPaused,
    error,
  } = useGlobalWakeWord()

  // Play a subtle activation chime on wake word detection
  // Uses the shared webAudioSounds utility which defers AudioContext
  // creation until after a user gesture (avoids browser autoplay policy errors)
  useEffect(() => {
    if (!isActivated) return
    playSynthSound('chime', 0.15)
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
            className="fixed top-3 right-3 z-[100] flex items-center gap-2 rounded-full bg-slate-900/90 border border-[#d4a44c]/20 px-3 py-1.5 backdrop-blur-sm shadow-lg"
            aria-label="KIAAN is listening for wake word"
            role="status"
          >
            {/* Pulsing microphone dot */}
            <motion.div
              className="relative h-2.5 w-2.5"
              aria-hidden="true"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-[#d4a44c]"
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
              <div className="absolute inset-0 rounded-full bg-[#d4a44c]" />
            </motion.div>

            <span className="text-[11px] font-medium text-[#e8b54a]/80 select-none">
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
