'use client'

/**
 * BreathworkPhase — Animated breathing guide synced to lotus visualization.
 * Adapts pattern based on mood (calming, energizing, or balanced).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BreathingLotus } from '../visuals/BreathingLotus'
import type { BreathingPattern } from '@/types/sadhana.types'

interface BreathworkPhaseProps {
  pattern: BreathingPattern
  onComplete: () => void
}

export function BreathworkPhase({ pattern, onComplete }: BreathworkPhaseProps) {
  const [started, setStarted] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleCycleComplete = () => {
    setCompleted(true)
    setTimeout(onComplete, 1500)
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-light mb-1">
          Pranayama
        </h2>
        <p className="text-sm text-[#d4a44c]/60">
          {pattern.name} &middot; {pattern.description}
        </p>
      </motion.div>

      {/* Lotus */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <BreathingLotus
          pattern={pattern}
          isActive={started}
          onCycleComplete={handleCycleComplete}
        />
      </motion.div>

      {/* Start / Complete button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-10"
      >
        {!started ? (
          <motion.button
            onClick={() => setStarted(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-full bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30 backdrop-blur-md hover:bg-[#d4a44c]/30 transition-colors"
          >
            Begin Breathing
          </motion.button>
        ) : completed ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#d4a44c] text-lg"
          >
            Beautifully done
          </motion.p>
        ) : (
          <motion.button
            onClick={onComplete}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 rounded-full text-[#d4a44c]/40 text-sm hover:text-[#d4a44c]/60 transition-colors"
          >
            Skip
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  )
}
