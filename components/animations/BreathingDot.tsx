/**
 * BreathingDot - A calm, pulsing dot animation shown during the micro-pause
 * before AI response content is revealed.
 *
 * Uses Framer Motion for a gentle scale + opacity "breathing" cycle.
 * This is intentionally NOT a spinner — it signals "preparing something
 * thoughtful" rather than "loading".
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface BreathingDotProps {
  /** Whether the dot is visible */
  visible: boolean
  /** Optional label for screen readers */
  label?: string
  className?: string
}

export function BreathingDot({
  visible,
  label = 'Preparing a thoughtful response...',
  className = '',
}: BreathingDotProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`flex items-center justify-center gap-3 py-6 ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-label={label}
        >
          {/* The breathing dot */}
          <motion.span
            className="block h-3 w-3 rounded-full bg-gradient-to-br from-orange-400 to-amber-300"
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          />
          <span className="sr-only">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
