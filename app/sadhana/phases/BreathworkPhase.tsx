'use client'

/**
 * BreathworkPhase — Immersive pranayama experience with body awareness cues.
 * Cosmic atmosphere, breathing guide ring, Gita reference, and cycling wisdom.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BreathingLotus } from '../visuals/BreathingLotus'
import { SacredButton } from '../components/SacredButton'
import type { BreathingPattern } from '@/types/sadhana.types'

interface BreathworkPhaseProps {
  pattern: BreathingPattern
  onComplete: () => void
}

const AWARENESS_CUES = [
  'Feel your chest rise with the breath of life...',
  'Release all tension with every exhale...',
  'Be present in this sacred moment...',
  'Let prana flow through every cell...',
  'Surrender to the rhythm of the universe...',
  'Each breath draws you closer to the divine...',
]

const COMPLETION_SHLOKA = 'प्राणापानगती रुद्ध्वा — Having restrained the movements of breath'

export function BreathworkPhase({ pattern, onComplete }: BreathworkPhaseProps) {
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [cueIndex, setCueIndex] = useState(0)
  const cueTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleCycleComplete = () => {
    setCompleted(true)
    if (cueTimer.current) clearInterval(cueTimer.current)
    setTimeout(onComplete, 2000)
  }

  /* Rotate awareness cues */
  useEffect(() => {
    if (!started || completed) return
    cueTimer.current = setInterval(() => {
      setCueIndex(i => (i + 1) % AWARENESS_CUES.length)
    }, 5000)
    return () => { if (cueTimer.current) clearInterval(cueTimer.current) }
  }, [started, completed])

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Gita reference */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-[10px] text-[#87CEEB]/30 tracking-[0.25em] uppercase mb-2"
      >
        BG 4.29 — prāṇāpāne
      </motion.p>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-6"
      >
        <h2
          className="text-2xl md:text-3xl font-light mb-1 text-[#FFF8DC]"
          style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
        >
          प्राणायाम
        </h2>
        <p className="text-sm text-[#87CEEB]/50 font-light">
          {pattern.name} · {pattern.description}
        </p>
      </motion.div>

      {/* Lotus with breathing guide */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.9 }}
        className="relative"
      >
        <BreathingLotus
          pattern={pattern}
          isActive={started}
          onCycleComplete={handleCycleComplete}
        />
      </motion.div>

      {/* Body awareness cue — cycling text */}
      <AnimatePresence mode="wait">
        {started && !completed && (
          <motion.p
            key={cueIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6 }}
            className="mt-6 text-[#87CEEB]/40 text-sm font-light italic text-center max-w-sm"
          >
            {AWARENESS_CUES[cueIndex]}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        {!started ? (
          <SacredButton variant="golden" onClick={() => setStarted(true)}>
            Begin Pranayama
          </SacredButton>
        ) : completed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-[#87CEEB]/70 text-lg font-light mb-2">Beautifully done</p>
            <p
              className="text-[#d4a44c]/40 text-xs italic"
              style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
            >
              {COMPLETION_SHLOKA}
            </p>
          </motion.div>
        ) : (
          <SacredButton variant="whisper" onClick={onComplete}>
            Skip
          </SacredButton>
        )}
      </motion.div>
    </motion.div>
  )
}
