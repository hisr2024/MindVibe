'use client'

/**
 * MobileBreathworkPhase — Full-screen immersive breathing sanctuary.
 * Wraps MobileBreathingLotus with awareness cues and phase transitions.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileBreathingLotus } from '../visuals/MobileBreathingLotus'
import type { BreathingPattern } from '@/types/sadhana.types'

const AWARENESS_CUES = [
  'Feel your chest rise with the breath of life...',
  'The Atman breathes through you — you are not the breather...',
  'Each exhale releases what no longer serves...',
  'Prana flows through you as it flows through all creation...',
  'In the space between breaths, the divine resides...',
  'Breathe as the ocean — full, complete, returning...',
  'Your breath is your first mantra...',
  'Let the body breathe itself. You are the witness.',
]

interface MobileBreathworkPhaseProps {
  pattern: BreathingPattern
  onComplete: () => void
}

export function MobileBreathworkPhase({ pattern, onComplete }: MobileBreathworkPhaseProps) {
  const [completed, setCompleted] = useState(false)
  const [cueIndex, setCueIndex] = useState(0)

  const handleComplete = useCallback(() => {
    setCompleted(true)
    setTimeout(onComplete, 1500)
  }, [onComplete])

  // Rotate awareness cues
  useEffect(() => {
    const interval = setInterval(() => {
      setCueIndex(prev => (prev + 1) % AWARENESS_CUES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-[100vh] flex flex-col items-center justify-center">
      {/* Pattern name */}
      <motion.div
        className="absolute top-8 left-0 right-0 text-center z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[9px] font-[family-name:var(--font-ui)] text-[#D4A017] uppercase tracking-[0.15em] mb-1">
          {pattern.name}
        </p>
        <p className="text-xs font-[family-name:var(--font-scripture)] italic text-[#B8AE98]">
          {pattern.description}
        </p>
      </motion.div>

      {/* Breathing Lotus */}
      <MobileBreathingLotus
        pattern={pattern}
        onComplete={handleComplete}
        onSkip={onComplete}
      />

      {/* Awareness cue */}
      <div className="absolute bottom-24 left-0 right-0 px-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={cueIndex}
            className="text-center font-[family-name:var(--font-scripture)] italic text-sm text-[#B8AE98] leading-[1.7]"
            style={{ maxWidth: 280, margin: '0 auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {AWARENESS_CUES[cueIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Completion message */}
      <AnimatePresence>
        {completed && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-[#050714]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.p
              className="font-[family-name:var(--font-divine)] text-xl text-[#D4A017] italic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              प्राणायाम पूर्ण
            </motion.p>
            <motion.p
              className="font-[family-name:var(--font-scripture)] text-sm text-[#B8AE98] italic mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Breathwork complete
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
