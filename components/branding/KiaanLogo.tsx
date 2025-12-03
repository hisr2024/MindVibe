'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

interface KiaanLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  animated?: boolean
  className?: string
}

/**
 * Animated KIAAN logo with "KIAAN — MindVibe Companion" branding.
 * Features Krishna flute accent in K letterform and peacock feather with gentle sway animation.
 * Premium embossed gradient on text, NOT mythological—purely symbolic.
 */
export function KiaanLogo({
  size = 'md',
  showTagline = true,
  animated = true,
  className = '',
}: KiaanLogoProps) {
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion
  const [isHovered, setIsHovered] = useState(false)

  const sizes = {
    sm: { container: 'h-12', text: 'text-lg', tagline: 'text-[10px]', feather: 24 },
    md: { container: 'h-16', text: 'text-2xl', tagline: 'text-xs', feather: 32 },
    lg: { container: 'h-24', text: 'text-4xl', tagline: 'text-sm', feather: 48 },
  }

  const { container, text, tagline, feather } = sizes[size]

  // Feather sway animation (3s loop as specified)
  const featherSwayAnimation = isAnimated
    ? {
        rotate: [0, 2, -2, 0],
      }
    : undefined

  const featherSwayTransition = {
    duration: 3,
    repeat: Infinity,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number], // cubic-bezier
  }

  // Hover glow animation
  const hoverGlowAnimation = isHovered
    ? {
        filter: 'drop-shadow(0 0 12px rgba(255, 115, 39, 0.5))',
        scale: 1.02,
      }
    : {
        filter: 'drop-shadow(0 0 0 transparent)',
        scale: 1,
      }

  return (
    <motion.div
      className={`flex items-center gap-3 ${container} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="KIAAN — MindVibe Companion"
    >
      {/* Peacock Feather with Flute Accent */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={featherSwayAnimation}
        transition={isAnimated ? featherSwayTransition : undefined}
      >
        <PeacockFeatherIcon
          size={feather}
          isHovered={isHovered}
          isAnimated={isAnimated}
        />
      </motion.div>

      {/* KIAAN Text with Premium Gradient */}
      <motion.div
        className="flex flex-col"
        animate={hoverGlowAnimation}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={`font-bold tracking-[0.15em] ${text} bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(255,163,94,0.35)]`}
            style={{
              WebkitTextStroke: '0.5px rgba(42, 18, 8, 0.2)',
            }}
          >
            KIAAN
          </span>
          {showTagline && (
            <span className={`${tagline} text-orange-100/60 tracking-wider`}>
              — MindVibe Companion
            </span>
          )}
        </div>
        {showTagline && (
          <motion.span
            className={`${tagline} text-orange-100/70 tracking-[0.08em] mt-0.5`}
            initial={isAnimated ? { opacity: 0.7 } : false}
            animate={isAnimated ? { opacity: [0.7, 1, 0.7] } : false}
            transition={
              isAnimated
                ? {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : undefined
            }
          >
            Crisp, calm guidance
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  )
}

interface PeacockFeatherIconProps {
  size?: number
  isHovered?: boolean
  isAnimated?: boolean
}

/**
 * Peacock feather SVG with subtle Krishna flute accent.
 * Modern, symbolic design — not religious.
 */
function PeacockFeatherIcon({
  size = 32,
  isHovered = false,
  isAnimated = true,
}: PeacockFeatherIconProps) {
  return (
    <motion.svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 32 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Peacock feather"
    >
      <defs>
        {/* Feather gradient - teal to gold to deep blue */}
        <linearGradient
          id="feather-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#4fd1c5" />
          <stop offset="35%" stopColor="#38b2ac" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>

        {/* Eye gradient - gold center */}
        <radialGradient id="eye-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffc850" />
          <stop offset="50%" stopColor="#ff9933" />
          <stop offset="100%" stopColor="#ff7327" />
        </radialGradient>

        {/* Flute accent gradient */}
        <linearGradient id="flute-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff7327" />
          <stop offset="100%" stopColor="#ffc850" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="feather-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main feather shaft */}
      <motion.path
        d="M16 48 C16 48, 14 35, 15 20 C16 5, 16 2, 16 2"
        stroke="url(#feather-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        animate={
          isAnimated
            ? {
                pathLength: [1, 0.98, 1],
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

      {/* Feather barbs - left side */}
      <motion.path
        d="M15 20 C12 18, 8 15, 4 14 C8 16, 12 19, 15 22"
        fill="url(#feather-gradient)"
        opacity="0.8"
        animate={
          isAnimated
            ? {
                opacity: [0.8, 0.9, 0.8],
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

      {/* Feather barbs - right side */}
      <motion.path
        d="M17 20 C20 18, 24 15, 28 14 C24 16, 20 19, 17 22"
        fill="url(#feather-gradient)"
        opacity="0.8"
        animate={
          isAnimated
            ? {
                opacity: [0.8, 0.9, 0.8],
                transition: { delay: 0.15 },
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

      {/* Peacock eye - outer ring */}
      <motion.ellipse
        cx="16"
        cy="12"
        rx="8"
        ry="6"
        fill="none"
        stroke="url(#feather-gradient)"
        strokeWidth="2"
        filter={isHovered ? 'url(#feather-glow)' : undefined}
        animate={
          isAnimated
            ? {
                ry: [6, 6.3, 6],
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

      {/* Peacock eye - middle ring */}
      <ellipse
        cx="16"
        cy="12"
        rx="5"
        ry="4"
        fill="none"
        stroke="#1e40af"
        strokeWidth="1.5"
        opacity="0.9"
      />

      {/* Peacock eye - inner golden center */}
      <motion.ellipse
        cx="16"
        cy="12"
        rx="3"
        ry="2.5"
        fill="url(#eye-gradient)"
        animate={
          isHovered && isAnimated
            ? {
                scale: [1, 1.1, 1],
              }
            : undefined
        }
        transition={
          isAnimated
            ? {
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />

      {/* Subtle flute accent integrated into the K design - appears near base */}
      <motion.g opacity={isHovered ? 1 : 0.6}>
        <path
          d="M11 42 L21 42"
          stroke="url(#flute-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="13" cy="42" r="0.8" fill="#ff7327" />
        <circle cx="16" cy="42" r="0.8" fill="#ff9933" />
        <circle cx="19" cy="42" r="0.8" fill="#ffc850" />
      </motion.g>

      {/* Particle drift on hover */}
      {isHovered && isAnimated && (
        <>
          <motion.circle
            cx="8"
            cy="8"
            r="1"
            fill="#4fd1c5"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.8, 0], y: -8 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.circle
            cx="24"
            cy="10"
            r="0.8"
            fill="#ffc850"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.6, 0], y: -10 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
          />
          <motion.circle
            cx="12"
            cy="6"
            r="0.6"
            fill="#3b82f6"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.7, 0], y: -6 }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
          />
        </>
      )}
    </motion.svg>
  )
}

export default KiaanLogo
