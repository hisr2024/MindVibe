'use client'

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface KrishnaSymbolProps {
  size?: number
  animated?: boolean
  className?: string
  glow?: boolean
}

/**
 * Sacred Krishna peacock feather symbol.
 * A richly detailed, luminous peacock feather with concentric eye,
 * radiating golden light, shimmering barbs, and a soft divine aura.
 * Uses useId() for unique gradient IDs — safe to render multiple instances.
 */
export function KrishnaSymbol({
  size = 20,
  animated = true,
  className = '',
  glow = true,
}: KrishnaSymbolProps) {
  const uid = useId()
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion

  const id = (name: string) => `${uid}-${name}`

  return (
    <motion.svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 32 43"
      fill="none"
      className={`inline-block align-middle ${className}`}
      aria-label="Krishna peacock feather"
      role="img"
      style={glow ? { filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.45)) drop-shadow(0 0 14px rgba(245, 158, 11, 0.2))' } : undefined}
      initial={isAnimated ? { rotate: -2 } : undefined}
      animate={isAnimated ? { rotate: [-2, 2.5, -2] } : undefined}
      transition={
        isAnimated
          ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
          : undefined
      }
    >
      <defs>
        {/* Quill shaft — warm gold to bronze */}
        <linearGradient id={id('shaft')} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#92600a" />
          <stop offset="30%" stopColor="#b8860b" />
          <stop offset="70%" stopColor="#d4a843" />
          <stop offset="100%" stopColor="#f5d17a" />
        </linearGradient>

        {/* Vane fill — deep emerald to bright green with teal tinge */}
        <linearGradient id={id('vaneL')} x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#0d6b3e" />
          <stop offset="35%" stopColor="#1a9e5c" />
          <stop offset="65%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id={id('vaneR')} x1="100%" y1="30%" x2="0%" y2="70%">
          <stop offset="0%" stopColor="#0d6b3e" />
          <stop offset="35%" stopColor="#1a9e5c" />
          <stop offset="65%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Outer eye ring — deep indigo to royal blue */}
        <radialGradient id={id('eyeOuter')} cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#0c2461" />
        </radialGradient>

        {/* Inner eye ring — vivid blue to turquoise */}
        <radialGradient id={id('eyeInner')} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>

        {/* Golden center — radiant saffron glow */}
        <radialGradient id={id('center')} cx="50%" cy="48%" r="50%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="30%" stopColor="#fcd34d" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>

        {/* Divine aura behind the feather */}
        <radialGradient id={id('aura')} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="rgba(251, 191, 36, 0.3)" />
          <stop offset="50%" stopColor="rgba(245, 158, 11, 0.08)" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
        </radialGradient>

        {/* Feather tip shimmer */}
        <linearGradient id={id('tipShimmer')} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Soft divine aura behind feather */}
      {glow && (
        <motion.ellipse
          cx="16"
          cy="16"
          rx="14"
          ry="12"
          fill={`url(#${id('aura')})`}
          animate={isAnimated ? { opacity: [0.5, 0.9, 0.5], scale: [0.96, 1.06, 0.96] } : undefined}
          transition={isAnimated ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
        />
      )}

      {/* ---- QUILL SHAFT — elegant curve with tapered stroke ---- */}
      <path
        d="M16 42 C16 42, 15.6 30, 16 20 C16.2 14, 16.1 7, 16 3"
        stroke={`url(#${id('shaft')})`}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Shaft highlight */}
      <path
        d="M16.3 40 C16.3 40, 16 30, 16.2 20 C16.3 14, 16.2 8, 16.2 4"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.3"
        fill="none"
        strokeLinecap="round"
      />

      {/* ---- LEFT VANE — layered barbs for depth ---- */}
      {/* Outer left barb */}
      <path
        d="M16 12 C13.5 10.5, 9 10.5, 6 13 C4 15, 4 17.5, 5.5 19 C7.5 20.5, 11 20, 14 17.5 C15.2 16.3, 16 14.5, 16 12"
        fill={`url(#${id('vaneL')})`}
        opacity="0.88"
      />
      {/* Inner left highlight */}
      <path
        d="M16 13 C14 12, 10.5 12, 8 14 C6.5 15.5, 6.5 17, 8 18 C9.5 18.8, 12.5 18, 14.5 16 C15.5 15, 16 13.8, 16 13"
        fill="rgba(52, 211, 153, 0.35)"
      />

      {/* ---- RIGHT VANE — mirror of left ---- */}
      <path
        d="M16 12 C18.5 10.5, 23 10.5, 26 13 C28 15, 28 17.5, 26.5 19 C24.5 20.5, 21 20, 18 17.5 C16.8 16.3, 16 14.5, 16 12"
        fill={`url(#${id('vaneR')})`}
        opacity="0.88"
      />
      {/* Inner right highlight */}
      <path
        d="M16 13 C18 12, 21.5 12, 24 14 C25.5 15.5, 25.5 17, 24 18 C22.5 18.8, 19.5 18, 17.5 16 C16.5 15, 16 13.8, 16 13"
        fill="rgba(52, 211, 153, 0.35)"
      />

      {/* ---- UPPER WISPS — delicate feathering at top ---- */}
      <path
        d="M16 7 C13.5 5.5, 10.5 6, 9.5 8 C9 9.5, 10 10.5, 12 10 C13.8 9.5, 15.2 8.2, 16 7"
        fill="#34d399"
        opacity="0.55"
      />
      <path
        d="M16 7 C18.5 5.5, 21.5 6, 22.5 8 C23 9.5, 22 10.5, 20 10 C18.2 9.5, 16.8 8.2, 16 7"
        fill="#34d399"
        opacity="0.55"
      />
      {/* Tiny top wisps */}
      <path
        d="M16 4.5 C14 3.5, 12 4, 11.5 5.5 C11.2 6.5, 12.5 7, 14 6.5 C15.2 6, 15.7 5.2, 16 4.5"
        fill="#6ee7b7"
        opacity="0.35"
      />
      <path
        d="M16 4.5 C18 3.5, 20 4, 20.5 5.5 C20.8 6.5, 19.5 7, 18 6.5 C16.8 6, 16.3 5.2, 16 4.5"
        fill="#6ee7b7"
        opacity="0.35"
      />

      {/* ---- BARB VEINS — fine lines on the vanes ---- */}
      <path d="M10 13 C12 14, 14 14.5, 16 14" stroke="rgba(255,255,255,0.18)" strokeWidth="0.3" fill="none" />
      <path d="M8 16 C11 16, 14 15.5, 16 15" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" fill="none" />
      <path d="M22 13 C20 14, 18 14.5, 16 14" stroke="rgba(255,255,255,0.18)" strokeWidth="0.3" fill="none" />
      <path d="M24 16 C21 16, 18 15.5, 16 15" stroke="rgba(255,255,255,0.14)" strokeWidth="0.3" fill="none" />

      {/* ==== THE SACRED EYE ==== */}

      {/* Outer eye — deep blue ring */}
      <ellipse
        cx="16"
        cy="15"
        rx="4.5"
        ry="4"
        fill={`url(#${id('eyeOuter')})`}
        opacity="0.95"
      />

      {/* Middle eye ring — vivid blue */}
      <ellipse
        cx="16"
        cy="14.8"
        rx="3.2"
        ry="2.8"
        fill={`url(#${id('eyeInner')})`}
        opacity="0.92"
      />

      {/* Inner golden center — the divine core */}
      <motion.ellipse
        cx="16"
        cy="14.8"
        rx="1.6"
        ry="1.4"
        fill={`url(#${id('center')})`}
        animate={
          isAnimated
            ? { opacity: [0.85, 1, 0.85], scale: [0.94, 1.12, 0.94] }
            : undefined
        }
        transition={
          isAnimated
            ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Golden sparkle on eye — top-left highlight */}
      <ellipse cx="15" cy="14" rx="0.55" ry="0.4" fill="#fffef5" opacity="0.85" />

      {/* Tiny diamond sparkle — bottom-right catchlight */}
      <motion.circle
        cx="17.2"
        cy="15.8"
        r="0.3"
        fill="#fef3c7"
        opacity="0.7"
        animate={isAnimated ? { opacity: [0.4, 0.9, 0.4] } : undefined}
        transition={isAnimated ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } : undefined}
      />

      {/* Subtle ring glow around the eye */}
      <motion.ellipse
        cx="16"
        cy="15"
        rx="5.5"
        ry="5"
        stroke="rgba(251, 191, 36, 0.3)"
        strokeWidth="0.5"
        fill="none"
        animate={isAnimated ? { opacity: [0.2, 0.55, 0.2], scale: [0.97, 1.05, 0.97] } : undefined}
        transition={isAnimated ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </motion.svg>
  )
}
