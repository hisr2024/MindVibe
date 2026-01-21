'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { auraRings, gradientCss, type AuraKey, type GradientKey } from './brandTokens'

export interface MindVibeIconProps {
  size?: number
  theme?: 'sunrise' | 'ocean' | 'aurora'
  animated?: boolean
  className?: string
}

const gradientMap: Record<NonNullable<MindVibeIconProps['theme']>, GradientKey> = {
  sunrise: 'mvGradientSunrise',
  ocean: 'mvGradientOcean',
  aurora: 'mvGradientAurora',
}

const auraMap: Record<NonNullable<MindVibeIconProps['theme']>, AuraKey> = {
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
      {/* Outer aura glow */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          filter: 'blur(14px)',
          backgroundImage: auraRings[auraKey],
        }}
      />

      {/* Background badge */}
      <motion.div
        className="absolute inset-0 rounded-[28%]"
        style={{
          background: '#0B0B0F',
          boxShadow: '0 24px 64px rgba(6, 10, 22, 0.35), 0 0 32px rgba(255,255,255,0.04)',
        }}
        animate={
          isAnimated
            ? {
                scale: [1, 1.02, 1],
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

      {/* Inner container */}
      <motion.div
        className="absolute inset-[4%] rounded-[24%]"
        style={{
          background: '#0F1219',
        }}
      />

      {/* Divine halo glow */}
      <motion.div
        className="absolute inset-[15%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(255, 183, 71, 0.2) 50%, transparent 100%)',
        }}
        animate={
          isAnimated
            ? {
                opacity: [0.6, 1, 0.6],
                scale: [0.95, 1.05, 0.95],
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

      {/* Divine Lotus SVG */}
      <motion.svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden
        initial={isAnimated ? { y: 1 } : undefined}
        animate={isAnimated ? { y: [1, -1, 1] } : undefined}
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
          {/* Divine Gradient */}
          <linearGradient id={`divine-gradient-${theme}`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="35%" stopColor="#F7931E" />
            <stop offset="70%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          {/* Inner Light */}
          <radialGradient id={`inner-light-${theme}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFEF0" />
            <stop offset="40%" stopColor="#FFE4B5" />
            <stop offset="100%" stopColor="#FFD700" />
          </radialGradient>

          {/* Petal Gold */}
          <linearGradient id={`petal-gold-${theme}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#F7931E" />
            <stop offset="50%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>

          <filter id={`soft-glow-${theme}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sacred meditation ring */}
        <circle cx="32" cy="32" r="27" stroke={`url(#divine-gradient-${theme})`} strokeWidth="0.5" fill="none" opacity="0.3" />

        {/* DIVINE LOTUS FLOWER */}
        {/* Top Petal */}
        <path
          d="M32 10 C36 14, 39 21, 39 28 C39 31, 36 34, 32 35 C28 34, 25 31, 25 28 C25 21, 28 14, 32 10Z"
          fill={`url(#petal-gold-${theme})`}
          opacity="0.9"
          filter={`url(#soft-glow-${theme})`}
        />

        {/* Left Wing Petal */}
        <path
          d="M12 30 C17 26, 24 24, 30 26 C32 28, 33 31, 33 33 C29 35, 20 34, 15 31 C10 28, 10 30, 12 30Z"
          fill={`url(#divine-gradient-${theme})`}
          opacity="0.85"
        />

        {/* Right Wing Petal */}
        <path
          d="M52 30 C47 26, 40 24, 34 26 C32 28, 31 31, 31 33 C35 35, 44 34, 49 31 C54 28, 54 30, 52 30Z"
          fill={`url(#divine-gradient-${theme})`}
          opacity="0.85"
        />

        {/* Lower Left Petal */}
        <path
          d="M16 42 C20 38, 26 37, 30 40 C31 43, 31 47, 31 50 C27 51, 19 49, 16 44 C13 40, 14 42, 16 42Z"
          fill={`url(#petal-gold-${theme})`}
          opacity="0.75"
        />

        {/* Lower Right Petal */}
        <path
          d="M48 42 C44 38, 38 37, 34 40 C33 43, 33 47, 33 50 C37 51, 45 49, 48 44 C51 40, 50 42, 48 42Z"
          fill={`url(#petal-gold-${theme})`}
          opacity="0.75"
        />

        {/* Center Petal */}
        <path
          d="M32 18 C35 22, 37 28, 37 33 C37 37, 35 40, 32 42 C29 40, 27 37, 27 33 C27 28, 29 22, 32 18Z"
          fill={`url(#inner-light-${theme})`}
          filter={`url(#soft-glow-${theme})`}
        />

        {/* Inner Divine Light Core */}
        <ellipse cx="32" cy="30" rx="4" ry="5" fill={`url(#inner-light-${theme})`} opacity="0.95" />
        <ellipse cx="32" cy="29" rx="2" ry="3" fill="#FFFEF5" opacity="0.9" />

        {/* Light rays */}
        <g opacity="0.4" stroke="#FFD700" strokeWidth="0.5" strokeLinecap="round">
          <line x1="32" y1="14" x2="32" y2="10" />
          <line x1="40" y1="17" x2="43" y2="14" />
          <line x1="24" y1="17" x2="21" y2="14" />
        </g>

        {/* Sparkles */}
        <circle cx="40" cy="20" r="0.8" fill="#FFE4B5" opacity="0.8" />
        <circle cx="24" cy="20" r="0.8" fill="#FFE4B5" opacity="0.8" />
        <circle cx="32" cy="12" r="1" fill="#FFFEF5" opacity="0.9" />

        {/* Bottom lotus seat accent */}
        <path d="M24 52 Q32 56, 40 52" stroke={`url(#divine-gradient-${theme})`} strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
      </motion.svg>
    </motion.div>
  )
}

function Ripple({ size, delay }: { size: number; delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-[28%] border border-amber-400/20"
      style={{ boxShadow: '0 0 0 1px rgba(255,191,0,0.08)' }}
      initial={{ scale: 1.2, opacity: 0.5 }}
      animate={{ scale: 1.8, opacity: 0 }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay }}
    />
  )
}
