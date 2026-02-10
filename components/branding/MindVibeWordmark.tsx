'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { gradientCss } from './brandTokens'
import { KrishnaSymbol } from './KrishnaSymbol'

interface MindVibeWordmarkProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showTagline?: boolean
  className?: string
}

const sizes = {
  sm: { text: 'text-xl', tagline: 'text-[11px]', krishnaSize: 12 },
  md: { text: 'text-3xl', tagline: 'text-xs', krishnaSize: 14 },
  lg: { text: 'text-4xl', tagline: 'text-sm', krishnaSize: 16 },
}

export function MindVibeWordmark({
  size = 'md',
  animated = true,
  showTagline = true,
  className = '',
}: MindVibeWordmarkProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion
  const { text, tagline, krishnaSize } = sizes[size]

  return (
    <motion.div
      className={`flex flex-col leading-tight ${className}`}
      animate={isAnimated ? { filter: 'drop-shadow(0 8px 26px rgba(255, 147, 89, 0.32))' } : undefined}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      aria-label="MindVibe wordmark"
    >
      <motion.span
        className={`font-extrabold tracking-[0.06em] ${text} bg-clip-text text-transparent`}
        style={{ backgroundImage: gradientCss.mvGradientSunrise }}
        initial={isAnimated ? { opacity: 0.8, y: 2 } : undefined}
        animate={isAnimated ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        MindVibe
      </motion.span>
      {showTagline && (
        <motion.span
          className={`${tagline} font-semibold text-orange-50/80 tracking-[0.08em] flex items-center gap-1`}
          initial={isAnimated ? { opacity: 0.7 } : undefined}
          animate={isAnimated ? { opacity: [0.7, 1, 0.7] } : undefined}
          transition={
            isAnimated
              ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        >
          Your{' '}
          <KrishnaSymbol size={krishnaSize} animated={animated} />
          {' '}Spiritual Companion
        </motion.span>
      )}
    </motion.div>
  )
}
