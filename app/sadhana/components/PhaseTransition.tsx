'use client'

/**
 * PhaseTransition — Cinematic transition overlay between Sadhana phases.
 * Applies phase-specific enter/exit animations with sacred geometry.
 */

import { motion, type Variants } from 'framer-motion'
import type { SadhanaPhase } from '@/types/sadhana.types'

interface PhaseTransitionProps {
  phase: SadhanaPhase
  children: React.ReactNode
}

/**
 * Phase-specific animation variants.
 * Each phase enters and exits differently to break the repetitive feel.
 */
const phaseVariants: Record<string, Variants> = {
  arrival: {
    initial: { opacity: 0, scale: 1.05, filter: 'blur(8px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, scale: 0.95, filter: 'blur(4px)', transition: { duration: 0.6 } },
  },
  breathwork: {
    initial: { opacity: 0, y: 40, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.5 } },
  },
  verse: {
    initial: { opacity: 0, rotateX: 8, y: 30 },
    animate: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.5 } },
  },
  reflection: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: 30, transition: { duration: 0.5 } },
  },
  intention: {
    initial: { opacity: 0, scale: 0.9, filter: 'brightness(1.5)' },
    animate: { opacity: 1, scale: 1, filter: 'brightness(1)', transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, scale: 1.1, filter: 'brightness(2)', transition: { duration: 0.6 } },
  },
  complete: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 1.2, type: 'spring', stiffness: 80 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  },
}

const defaultVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
}

export function PhaseTransition({ phase, children }: PhaseTransitionProps) {
  const variants = phaseVariants[phase] || defaultVariants

  return (
    <motion.div
      key={phase}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full min-h-screen"
      style={{ perspective: 1000 }}
    >
      {children}
    </motion.div>
  )
}
