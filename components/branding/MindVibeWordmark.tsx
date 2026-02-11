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
  sm: { text: 'text-xl', tagline: 'text-[11px]', spiritual: 'text-xs', krishnaSize: 14, gap: 'gap-0.5' },
  md: { text: 'text-3xl', tagline: 'text-xs', spiritual: 'text-sm', krishnaSize: 18, gap: 'gap-1' },
  lg: { text: 'text-4xl', tagline: 'text-sm', spiritual: 'text-base', krishnaSize: 22, gap: 'gap-1.5' },
}

export function MindVibeWordmark({
  size = 'md',
  animated = true,
  showTagline = true,
  className = '',
}: MindVibeWordmarkProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion
  const { text, tagline, spiritual, krishnaSize, gap } = sizes[size]

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
          className={`${tagline} font-medium text-orange-50/60 tracking-[0.08em] flex items-center ${gap}`}
          initial={isAnimated ? { opacity: 0 } : undefined}
          animate={isAnimated ? { opacity: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Your{' '}
          <span className="relative inline-flex items-center">
            <KrishnaSymbol size={krishnaSize} animated={animated} glow />
            <motion.span
              className={`${spiritual} font-bold tracking-[0.1em] bg-clip-text text-transparent`}
              style={{
                backgroundImage: gradientCss.spiritualSaffron,
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
              }}
              animate={
                isAnimated
                  ? { filter: [
                      'drop-shadow(0 0 6px rgba(251, 191, 36, 0.3))',
                      'drop-shadow(0 0 12px rgba(251, 191, 36, 0.55))',
                      'drop-shadow(0 0 6px rgba(251, 191, 36, 0.3))',
                    ]}
                  : undefined
              }
              transition={
                isAnimated
                  ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              Spiritual
            </motion.span>
          </span>
          {' '}Companion
        </motion.span>
      )}
    </motion.div>
  )
}
