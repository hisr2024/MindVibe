'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { auraRings, gradientCss, type AuraKey, type GradientKey } from './brandTokens'

export interface MindVibeIconProps {
  size?: number
  theme?: 'sunrise' | 'ocean' | 'aurora'
  animated?: boolean
  className?: string
}

const gradientMap: Record<MindVibeIconProps['theme'], GradientKey> = {
  sunrise: 'mvGradientSunrise',
  ocean: 'mvGradientOcean',
  aurora: 'mvGradientAurora',
}

const auraMap: Record<MindVibeIconProps['theme'], AuraKey> = {
  sunrise: 'sunrise',
  ocean: 'ocean',
  aurora: 'aurora',
}

export function MindVibeIcon({
  size = 64,
  theme = 'sunrise',
  animated = true,
  className = '',
}: MindVibeIconProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion
  const gradientKey = gradientMap[theme]
  const auraKey = auraMap[theme]

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={isAnimated ? { opacity: 0.8, scale: 0.94 } : undefined}
      animate={isAnimated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      aria-label="MindVibe badge"
      role="img"
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          filter: 'blur(14px)',
          backgroundImage: auraRings[auraKey],
        }}
      />

      <motion.div
        className="absolute inset-0 rounded-[28%]"
        style={{
          background: gradientCss[gradientKey],
          boxShadow: '0 24px 64px rgba(6, 10, 22, 0.35), 0 0 32px rgba(255,255,255,0.04)',
        }}
        animate={
          isAnimated
            ? {
                scale: [1, 1.04, 1],
              }
            : undefined
        }
        transition={
          isAnimated
            ? {
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />

      <motion.div
        className="absolute inset-[12%] rounded-[24%] border border-white/14"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0))',
          backdropFilter: 'blur(4px)',
        }}
        animate={
          isAnimated
            ? {
                opacity: [0.8, 1, 0.8],
              }
            : undefined
        }
        transition={
          isAnimated
            ? {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />

      {isAnimated && (
        <>
          <Ripple size={size} delay={0} />
          <Ripple size={size} delay={0.9} />
        </>
      )}

      <motion.svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
        initial={isAnimated ? { y: 2 } : undefined}
        animate={isAnimated ? { y: [2, -1, 2] } : undefined}
        transition={
          isAnimated
            ? {
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      >
        <defs>
          <linearGradient id={`mv-symbol-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.96)" />
            <stop offset="100%" stopColor="rgba(243, 244, 246, 0.82)" />
          </linearGradient>
        </defs>
        <path
          d="M16 46V18.8c0-0.8 0.64-1.3 1.42-1.3h6.6c0.5 0 0.96 0.24 1.22 0.62l6.96 10.4 6.96-10.4c0.26-0.38 0.72-0.62 1.22-0.62h6.6c0.78 0 1.42 0.5 1.42 1.3V46c0 0.8-0.64 1.3-1.42 1.3h-5.8c-0.78 0-1.42-0.5-1.42-1.3V31.6L33.8 43c-0.48 0.72-1.6 0.72-2.08 0L24.8 31.6V46c0 0.8-0.64 1.3-1.42 1.3h-5.96c-0.78 0-1.42-0.5-1.42-1.3Z"
          fill={`url(#mv-symbol-${theme})`}
        />
        <path
          d="M14 20c3.6-4.4 9.6-7.2 16.2-7.2 6.7 0 12.7 2.8 16.3 7.2"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.35}
        />
      </motion.svg>
    </motion.div>
  )
}

function Ripple({ size, delay }: { size: number; delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-[28%] border border-white/18"
      style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
      initial={{ scale: 1.2, opacity: 0.5 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay }}
    />
  )
}
