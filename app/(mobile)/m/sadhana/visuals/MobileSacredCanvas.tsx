'use client'

/**
 * MobileSacredCanvas — Phase-reactive animated background for Sadhana.
 * Uses CSS gradients and subtle animations to create an immersive cosmic backdrop
 * that adapts its color palette to each Sadhana phase.
 */

import { motion, AnimatePresence } from 'framer-motion'
import type { SadhanaPhase } from '@/types/sadhana.types'

const PHASE_PALETTES: Record<SadhanaPhase, { primary: string; secondary: string; opacity: number }> = {
  loading:    { primary: 'rgba(27,79,187,0.06)', secondary: 'rgba(212,160,23,0.03)', opacity: 0.4 },
  arrival:    { primary: 'rgba(27,79,187,0.08)', secondary: 'rgba(14,116,144,0.05)', opacity: 0.6 },
  breathwork: { primary: 'rgba(14,116,144,0.10)', secondary: 'rgba(212,160,23,0.04)', opacity: 0.7 },
  verse:      { primary: 'rgba(212,160,23,0.10)', secondary: 'rgba(240,192,64,0.06)', opacity: 0.8 },
  reflection: { primary: 'rgba(27,79,187,0.12)', secondary: 'rgba(14,116,144,0.06)', opacity: 0.6 },
  intention:  { primary: 'rgba(212,160,23,0.12)', secondary: 'rgba(240,192,64,0.08)', opacity: 0.85 },
  complete:   { primary: 'rgba(212,160,23,0.15)', secondary: 'rgba(14,116,144,0.08)', opacity: 1 },
}

interface MobileSacredCanvasProps {
  phase: SadhanaPhase
  moodColor?: string
}

export function MobileSacredCanvas({ phase, moodColor }: MobileSacredCanvasProps) {
  const palette = PHASE_PALETTES[phase]

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Base cosmic void */}
      <div className="absolute inset-0 bg-[#050714]" />

      {/* Primary radial glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`primary-${phase}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: palette.opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${moodColor || palette.primary}, transparent)`,
          }}
        />
      </AnimatePresence>

      {/* Secondary ambient glow */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: palette.opacity * 0.6 }}
        transition={{ duration: 1.5 }}
        style={{
          background: `radial-gradient(ellipse 60% 50% at 30% 70%, ${palette.secondary}, transparent)`,
        }}
      />

      {/* Subtle divine-breath pulse on the background */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full"
        style={{
          background: `radial-gradient(circle, ${palette.primary}, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
