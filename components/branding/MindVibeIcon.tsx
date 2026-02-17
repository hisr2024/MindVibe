'use client'

/**
 * MindVibeIcon - Refined sacred mark
 *
 * A clean, elegant golden lotus on a dark ground.
 * No ripple gimmicks, no flashy shimmer — just a sacred symbol
 * with a subtle breathing glow that feels divine, not decorative.
 */

import { motion, useReducedMotion } from 'framer-motion'

export interface MindVibeIconProps {
  size?: number
  theme?: 'sunrise' | 'ocean' | 'aurora'
  animated?: boolean
  className?: string
}

export function MindVibeIcon({
  size = 64,
  theme = 'sunrise',
  animated = true,
  className = '',
}: MindVibeIconProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion

  const themeGold = theme === 'ocean' ? '#6ad7ff' : theme === 'aurora' ? '#c2a5ff' : '#d4a44c'

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={isAnimated ? { opacity: 0.85, scale: 0.96 } : undefined}
      animate={isAnimated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      aria-label="MindVibe"
      role="img"
    >
      {/* Subtle outer glow — no ripples, just warmth */}
      <motion.div
        className="absolute inset-[-8%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${themeGold}18 0%, transparent 70%)`,
        }}
        aria-hidden
        animate={
          isAnimated
            ? { opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.05, 0.95] }
            : undefined
        }
        transition={
          isAnimated
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Background — clean dark circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(145deg, #0e1018 0%, #0a0c14 100%)',
          border: `1px solid ${themeGold}20`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 ${themeGold}08`,
        }}
      />

      {/* Sacred OM symbol — pure, centered */}
      <motion.span
        className="relative select-none"
        style={{
          fontFamily: 'var(--font-sacred), serif',
          fontSize: size * 0.42,
          lineHeight: 1,
          color: themeGold,
          textShadow: `0 0 16px ${themeGold}40, 0 0 32px ${themeGold}15`,
        }}
        aria-hidden
        animate={
          isAnimated
            ? { opacity: [0.7, 1, 0.7] }
            : undefined
        }
        transition={
          isAnimated
            ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      >
        &#x0950;
      </motion.span>
    </motion.div>
  )
}
