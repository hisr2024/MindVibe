'use client'

/**
 * PageTransitionWrapper — Fluid page transition layer
 *
 * Wraps page content with smooth entrance animations using Framer Motion.
 * Each page fades in with a subtle upward slide, creating a fluid
 * navigation experience. Uses layoutId-independent animations to
 * avoid layout thrashing.
 *
 * Performance: GPU-accelerated transforms only (opacity + translateY).
 * Respects prefers-reduced-motion.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
      opacity: { duration: 0.25 },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
}

const reducedMotionVariants = {
  initial: { opacity: 1, y: 0 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
}

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      variants={reduceMotion ? reducedMotionVariants : pageVariants}
      initial="initial"
      animate="enter"
      style={{
        willChange: 'opacity, transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </motion.div>
  )
}

export default PageTransitionWrapper
