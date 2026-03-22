'use client'

/**
 * SakhaAvatar — Animated avatar for Sakha (KIAAN) with 3 divine states.
 *
 * States:
 *   idle     → static golden border, soft glow
 *   thinking → slow golden pulse (2s cycle, scale 0.95–1.05, opacity breathe)
 *   speaking → fast golden pulse (0.8s cycle, brighter glow)
 *
 * Renders an OM symbol (ॐ) inside a golden circle.
 * Respects prefers-reduced-motion for accessibility.
 */

import { motion, useReducedMotion } from 'framer-motion'

type AvatarState = 'idle' | 'thinking' | 'speaking'
type AvatarSize = 'sm' | 'md' | 'lg'

interface SakhaAvatarProps {
  state: AvatarState
  size?: AvatarSize
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 56,
}

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  sm: 14,
  md: 20,
  lg: 26,
}

/**
 * Animation variants keyed by avatar state.
 * Each variant defines scale, opacity, boxShadow, and transition.
 */
const stateVariants = {
  idle: {
    scale: 1,
    opacity: 1,
    boxShadow: '0 0 8px rgba(228,181,74,0.3)',
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
  thinking: {
    scale: [0.95, 1.05, 0.95],
    opacity: [0.6, 1, 0.6],
    boxShadow: [
      '0 0 12px rgba(228,181,74,0.4)',
      '0 0 24px rgba(228,181,74,0.7)',
      '0 0 12px rgba(228,181,74,0.4)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
  speaking: {
    scale: [0.97, 1.03, 0.97],
    opacity: 1,
    boxShadow: [
      '0 0 16px rgba(228,181,74,0.6)',
      '0 0 28px rgba(228,181,74,0.9)',
      '0 0 16px rgba(228,181,74,0.6)',
    ],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

/** Static variant used when user prefers reduced motion. */
const reducedMotionVariant = {
  idle: { scale: 1, opacity: 1, boxShadow: '0 0 8px rgba(228,181,74,0.3)' },
  thinking: { scale: 1, opacity: 0.7, boxShadow: '0 0 20px rgba(228,181,74,0.5)' },
  speaking: { scale: 1, opacity: 1, boxShadow: '0 0 24px rgba(228,181,74,0.8)' },
}

export function SakhaAvatar({ state, size = 'md' }: SakhaAvatarProps) {
  const prefersReducedMotion = useReducedMotion()
  const px = SIZE_MAP[size]
  const fontSize = FONT_SIZE_MAP[size]

  const variants = prefersReducedMotion ? reducedMotionVariant : stateVariants
  const currentVariant = variants[state]

  return (
    <motion.div
      aria-label={`Sakha is ${state}`}
      role="img"
      animate={currentVariant}
      style={{
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        borderRadius: '50%',
        border: '2px solid #e8b54a',
        background: 'linear-gradient(135deg, #0f0f18 0%, #1a1520 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        color: '#e8b54a',
        fontFamily: 'serif',
        userSelect: 'none',
        cursor: 'default',
      }}
    >
      ॐ
    </motion.div>
  )
}
