'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface KrishnaSymbolProps {
  size?: number
  animated?: boolean
  className?: string
}

/**
 * Inline Krishna peacock feather symbol.
 * A minimal, elegant peacock feather representing Lord Krishna's divine presence.
 * Designed to sit beside the "Spiritual" text in the tagline.
 */
export function KrishnaSymbol({
  size = 16,
  animated = true,
  className = '',
}: KrishnaSymbolProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block ${className}`}
      aria-label="Krishna peacock feather"
      role="img"
      initial={isAnimated ? { rotate: -3 } : undefined}
      animate={isAnimated ? { rotate: [-3, 3, -3] } : undefined}
      transition={
        isAnimated
          ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          : undefined
      }
    >
      <defs>
        <linearGradient id="feather-shaft" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#D4A843" />
        </linearGradient>
        <linearGradient id="feather-vane" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#1B8A3E" />
          <stop offset="40%" stopColor="#2ECC71" />
          <stop offset="100%" stopColor="#1B8A3E" />
        </linearGradient>
        <radialGradient id="feather-eye" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="45%" stopColor="#1E90FF" />
          <stop offset="75%" stopColor="#0B5394" />
          <stop offset="100%" stopColor="#1B8A3E" />
        </radialGradient>
      </defs>

      {/* Feather shaft (quill) - graceful curve */}
      <path
        d="M12 23 C12 23, 11.5 16, 12 8 C12.3 4, 12 2, 12 1"
        stroke="url(#feather-shaft)"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left vane barbs */}
      <path
        d="M12 8 C10 7.5, 7.5 8, 6 10 C5 11.5, 5.5 13, 7 13.5 C8.5 14, 10.5 13, 12 11"
        fill="url(#feather-vane)"
        opacity="0.85"
      />

      {/* Right vane barbs */}
      <path
        d="M12 8 C14 7.5, 16.5 8, 18 10 C19 11.5, 18.5 13, 17 13.5 C15.5 14, 13.5 13, 12 11"
        fill="url(#feather-vane)"
        opacity="0.85"
      />

      {/* Upper feather wisp - left */}
      <path
        d="M12 5 C10 4, 8 4.5, 7.5 6 C7 7, 8 8, 9.5 7.5 C11 7, 11.5 6, 12 5"
        fill="#2ECC71"
        opacity="0.6"
      />

      {/* Upper feather wisp - right */}
      <path
        d="M12 5 C14 4, 16 4.5, 16.5 6 C17 7, 16 8, 14.5 7.5 C13 7, 12.5 6, 12 5"
        fill="#2ECC71"
        opacity="0.6"
      />

      {/* Peacock eye - the sacred eye of the feather */}
      <ellipse
        cx="12"
        cy="10.5"
        rx="3"
        ry="2.8"
        fill="url(#feather-eye)"
        opacity="0.95"
      />

      {/* Inner eye ring */}
      <ellipse
        cx="12"
        cy="10.5"
        rx="1.8"
        ry="1.6"
        fill="#1E90FF"
        opacity="0.9"
      />

      {/* Eye center - golden dot */}
      <motion.ellipse
        cx="12"
        cy="10.5"
        rx="0.8"
        ry="0.7"
        fill="#FFD700"
        opacity="0.95"
        animate={
          isAnimated
            ? { opacity: [0.8, 1, 0.8], scale: [0.95, 1.1, 0.95] }
            : undefined
        }
        transition={
          isAnimated
            ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Subtle golden shimmer on eye */}
      <ellipse cx="11.5" cy="10" rx="0.4" ry="0.3" fill="#FFFEF5" opacity="0.7" />
    </motion.svg>
  )
}
