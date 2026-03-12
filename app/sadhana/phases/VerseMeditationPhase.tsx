'use client'

/**
 * VerseMeditationPhase — Gita verse display with Sanskrit reveal + contemplation.
 * Shows the AI-selected verse with character-by-character animation.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SanskritReveal } from '../visuals/SanskritReveal'
import type { SadhanaVerse } from '@/types/sadhana.types'

interface VerseMeditationPhaseProps {
  verse: SadhanaVerse
  onComplete: () => void
}

export function VerseMeditationPhase({ verse, onComplete }: VerseMeditationPhaseProps) {
  const [revealDone, setRevealDone] = useState(false)
  const [contemplating, setContemplating] = useState(false)
  const [timer, setTimer] = useState(60)

  const handleRevealComplete = useCallback(() => {
    setRevealDone(true)
  }, [])

  /* Contemplation timer */
  useEffect(() => {
    if (!contemplating) return
    if (timer <= 0) {
      onComplete()
      return
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [contemplating, timer, onComplete])

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Verse reference */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-[#d4a44c]/50 mb-6 tracking-widest uppercase"
      >
        Bhagavad Gita {verse.chapter}.{verse.verse}
      </motion.p>

      {/* Sanskrit text reveal */}
      <div className="max-w-2xl px-4">
        <SanskritReveal
          text={verse.english}
          subtext={verse.transliteration}
          speed={40}
          onComplete={handleRevealComplete}
        />
      </div>

      {/* Modern insight */}
      {revealDone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 max-w-lg text-center"
        >
          <p className="text-[#d4a44c]/60 text-sm mb-4">KIAAN&apos;s Insight</p>
          <p className="text-[#FFF8DC]/70 font-light leading-relaxed">
            {verse.personalInterpretation}
          </p>
        </motion.div>
      )}

      {/* Action buttons */}
      {revealDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          {!contemplating ? (
            <>
              <motion.button
                onClick={() => setContemplating(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30 backdrop-blur-md hover:bg-[#d4a44c]/30 transition-colors"
              >
                Contemplate (60s)
              </motion.button>
              <motion.button
                onClick={onComplete}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 rounded-full text-[#d4a44c]/40 text-sm hover:text-[#d4a44c]/60 transition-colors"
              >
                Continue
              </motion.button>
            </>
          ) : (
            <div className="text-center">
              <motion.div
                className="w-16 h-16 rounded-full border border-[#d4a44c]/20 flex items-center justify-center mb-3"
                animate={{ borderColor: ['rgba(212,164,76,0.2)', 'rgba(212,164,76,0.5)', 'rgba(212,164,76,0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span className="text-[#d4a44c]/60 text-lg font-light">{timer}</span>
              </motion.div>
              <motion.button
                onClick={onComplete}
                whileHover={{ scale: 1.05 }}
                className="text-[#d4a44c]/40 text-sm hover:text-[#d4a44c]/60 transition-colors"
              >
                End early
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
