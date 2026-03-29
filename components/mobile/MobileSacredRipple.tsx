'use client'

/**
 * MobileSacredRipple — Touch-point golden expanding rings
 *
 * When triggered, 3 concentric golden rings expand from the touch
 * origin point, creating a divine ripple effect. Used as the entry
 * transition for Emotional Reset and Karma Reset sacred spaces.
 *
 * Uses the sacred-divine-ripple animation pattern.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface MobileSacredRippleProps {
  /** Origin point for the ripple (touch coordinates) */
  origin: { x: number; y: number }
  /** Whether the ripple is active */
  active: boolean
  /** Called when ripple animation completes */
  onComplete?: () => void
  /** Ripple color (CSS) — default divine gold */
  color?: string
  /** Number of rings */
  rings?: number
  /** Total duration in ms */
  duration?: number
}

export function MobileSacredRipple({
  origin,
  active,
  onComplete,
  color = 'var(--sacred-divine-gold, #D4A017)',
  rings = 3,
  duration = 1200,
}: MobileSacredRippleProps) {
  const reduceMotion = useReducedMotion()
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!active) {
      setIsComplete(false)
      return
    }

    if (reduceMotion) {
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setIsComplete(true)
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [active, duration, onComplete, reduceMotion])

  if (!active || isComplete || reduceMotion) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 200 }}
      aria-hidden="true"
    >
      {Array.from({ length: rings }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: origin.x,
            top: origin.y,
            transform: 'translate(-50%, -50%)',
            border: `2px solid ${color}`,
          }}
          initial={{
            width: 0,
            height: 0,
            opacity: 0.8,
          }}
          animate={{
            width: '150vmax',
            height: '150vmax',
            opacity: 0,
          }}
          transition={{
            duration: duration / 1000,
            delay: (i * 150) / 1000,
            ease: [0.0, 0.8, 0.2, 1.0], // sacred-ease-lotus-bloom
          }}
        />
      ))}
    </div>
  )
}

/**
 * MobileSacredOverlay — Full-screen dark overlay with radial bloom
 *
 * Used as the entry portal between mundane and sacred space.
 * Screen darkens from the touch point outward via a radial gradient.
 */
interface MobileSacredOverlayProps {
  /** Whether the overlay is active */
  active: boolean
  /** Origin point for the radial darkening */
  origin?: { x: number; y: number }
  /** Called when the overlay is fully dark */
  onDark?: () => void
  /** Called when the overlay finishes (fades out) */
  onComplete?: () => void
  /** How long the overlay stays dark before content blooms (ms) */
  holdDuration?: number
  children?: React.ReactNode
}

export function MobileSacredOverlay({
  active,
  origin,
  onDark,
  onComplete,
  holdDuration = 600,
  children,
}: MobileSacredOverlayProps) {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<'idle' | 'darkening' | 'dark' | 'blooming'>('idle')

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      return
    }

    if (reduceMotion) {
      setPhase('blooming')
      onDark?.()
      onComplete?.()
      return
    }

    setPhase('darkening')

    const darkTimer = setTimeout(() => {
      setPhase('dark')
      onDark?.()
    }, 400)

    const bloomTimer = setTimeout(() => {
      setPhase('blooming')
      onComplete?.()
    }, 400 + holdDuration)

    return () => {
      clearTimeout(darkTimer)
      clearTimeout(bloomTimer)
    }
  }, [active, holdDuration, onDark, onComplete, reduceMotion])

  const ox = origin ? `${origin.x}px` : '50%'
  const oy = origin ? `${origin.y}px` : '50%'

  return (
    <AnimatePresence>
      {active && phase !== 'idle' && (
        <motion.div
          className="fixed inset-0"
          style={{
            zIndex: 199,
            background:
              phase === 'darkening' || phase === 'dark'
                ? `radial-gradient(circle at ${ox} ${oy}, #050714 0%, #050714 100%)`
                : 'transparent',
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === 'blooming' ? 0 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: phase === 'darkening' ? 0.4 : 0.6,
            ease: 'easeInOut',
          }}
        >
          {phase === 'blooming' && children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MobileSacredRipple
