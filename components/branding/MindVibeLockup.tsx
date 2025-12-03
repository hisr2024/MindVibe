'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MindVibeIcon } from './MindVibeIcon'
import { MindVibeWordmark } from './MindVibeWordmark'
import { gradientCss } from './brandTokens'

interface MindVibeLockupProps {
  layout?: 'horizontal' | 'stacked'
  theme?: 'sunrise' | 'ocean' | 'aurora'
  showTagline?: boolean
  animated?: boolean
  className?: string
}

export function MindVibeLockup({
  layout = 'horizontal',
  theme = 'sunrise',
  showTagline = true,
  animated = true,
  className = '',
}: MindVibeLockupProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion
  const isStacked = layout === 'stacked'

  return (
    <motion.div
      className={`flex ${isStacked ? 'flex-col items-center gap-3' : 'items-center gap-4'} ${className}`}
      initial={isAnimated ? { opacity: 0.85, y: 4 } : undefined}
      animate={isAnimated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <MindVibeIcon size={isStacked ? 80 : 56} theme={theme} animated={animated} />
      <div className={isStacked ? 'items-center text-center' : ''}>
        <MindVibeWordmark size={isStacked ? 'lg' : 'md'} animated={animated} showTagline={showTagline} />
        {!showTagline && (
          <p
            className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70"
            style={{ backgroundImage: gradientCss.mvGradientOcean, WebkitBackgroundClip: 'text', color: 'transparent' }}
          >
            KIAAN — MindVibe Companion
          </p>
        )}
      </div>
    </motion.div>
  )
}
