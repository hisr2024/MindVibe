'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface MindVibeLogoProps {
  size?: number
  animated?: boolean
  className?: string
}

/**
 * Professional MindVibe logo component with premium minimal design.
 * Features soft orange→gold gradients, rounded geometry, and calming aesthetics.
 * Supports responsive sizing from 40px to 200px+.
 */
export function MindVibeLogo({
  size = 40,
  animated = true,
  className = '',
}: MindVibeLogoProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MindVibe logo"
      role="img"
      initial={isAnimated ? { scale: 0.95, opacity: 0.8 } : false}
      animate={isAnimated ? { scale: 1, opacity: 1 } : false}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      whileHover={isAnimated ? { scale: 1.02 } : undefined}
    >
      <defs>
        {/* Main gradient - orange to gold */}
        <linearGradient
          id="mindvibe-gradient-main"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff7327" />
          <stop offset="50%" stopColor="#ff9933" />
          <stop offset="100%" stopColor="#ffc850" />
        </linearGradient>

        {/* Lighter inner glow gradient */}
        <radialGradient
          id="mindvibe-glow"
          cx="50%"
          cy="50%"
          r="50%"
          fx="30%"
          fy="30%"
        >
          <stop offset="0%" stopColor="rgba(255, 200, 80, 0.4)" />
          <stop offset="70%" stopColor="rgba(255, 115, 39, 0.15)" />
          <stop offset="100%" stopColor="rgba(255, 115, 39, 0)" />
        </radialGradient>

        {/* Text gradient for M */}
        <linearGradient
          id="mindvibe-text-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0d0d0d" />
        </linearGradient>

        {/* Subtle drop shadow */}
        <filter id="mindvibe-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor="#ff7327"
            floodOpacity="0.25"
          />
        </filter>
      </defs>

      {/* Background circle with gradient */}
      <motion.circle
        cx="20"
        cy="20"
        r="18"
        fill="url(#mindvibe-gradient-main)"
        filter="url(#mindvibe-shadow)"
        animate={
          isAnimated
            ? {
                r: [18, 18.3, 18],
              }
            : undefined
        }
        transition={
          isAnimated
            ? {
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />

      {/* Inner glow overlay */}
      <circle cx="20" cy="20" r="17" fill="url(#mindvibe-glow)" />

      {/* Subtle inner ring for depth */}
      <circle
        cx="20"
        cy="20"
        r="16"
        fill="none"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="0.5"
      />

      {/* Stylized M letterform representing balance and grounding */}
      <motion.path
        d="M12 28V14.5c0-0.5 0.3-0.9 0.8-0.9h2.8c0.3 0 0.5 0.1 0.7 0.4l3.7 5.8 3.7-5.8c0.2-0.3 0.4-0.4 0.7-0.4h2.8c0.5 0 0.8 0.4 0.8 0.9V28c0 0.5-0.3 0.9-0.8 0.9h-2.4c-0.5 0-0.8-0.4-0.8-0.9V21l-3.2 5c-0.3 0.5-1.1 0.5-1.4 0L17 21v7c0 0.5-0.3 0.9-0.8 0.9h-2.4c-0.5 0-0.8-0.4-0.8-0.9Z"
        fill="url(#mindvibe-text-gradient)"
        animate={
          isAnimated
            ? {
                y: [0, -0.3, 0],
              }
            : undefined
        }
        transition={
          isAnimated
            ? {
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />

      {/* Subtle highlight arc at top */}
      <motion.path
        d="M10 14 C13 8, 27 8, 30 14"
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
        strokeLinecap="round"
        animate={
          isAnimated
            ? {
                opacity: [0.2, 0.35, 0.2],
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
    </motion.svg>
  )
}
