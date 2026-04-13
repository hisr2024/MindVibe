'use client'

/**
 * PageTransition - Smooth page-level transition wrapper.
 *
 * Wraps page content with a gentle fade + vertical slide animation
 * that fires on mount. Uses Framer Motion with spring physics
 * consistent with the rest of the MindVibe animation system.
 *
 * Respects prefers-reduced-motion for accessibility.
 */

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
  },
}

const reducedVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const pageTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 28,
  mass: 0.8,
}

const reducedTransition = {
  duration: 0.01,
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      variants={prefersReducedMotion ? reducedVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={prefersReducedMotion ? reducedTransition : pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
