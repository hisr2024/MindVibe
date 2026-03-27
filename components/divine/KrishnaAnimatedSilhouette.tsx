'use client'

/**
 * KrishnaAnimatedSilhouette — Animated authentic Krishna silhouette
 *
 * Reuses the proven, well-proportioned SVG paths from KrishnaSilhouette.tsx
 * to guarantee anatomically correct rendering. Adds subtle breathing and
 * aura animations via framer-motion. For `position="right"`, the figure
 * is cleanly mirrored using SVG transform.
 *
 * Designed to flank the Divine Presence banner — positioned absolutely
 * at the left or right edge of its container.
 */

import { motion, useReducedMotion } from 'framer-motion'

interface KrishnaAnimatedSilhouetteProps {
  position: 'left' | 'right'
  className?: string
}

export function KrishnaAnimatedSilhouette({
  position,
  className = '',
}: KrishnaAnimatedSilhouetteProps) {
  const reduceMotion = useReducedMotion()
  const idPrefix = `krishna-sil-${position}`

  return (
    <motion.div
      className={`pointer-events-none absolute bottom-0 ${
        position === 'left' ? 'left-0' : 'right-0'
      } h-full ${className}`}
      aria-hidden="true"
      style={{ opacity: 0.18 }}
      animate={
        reduceMotion
          ? undefined
          : { scale: [1, 1.03, 1] }
      }
      transition={
        reduceMotion
          ? undefined
          : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      <svg
        viewBox="0 0 400 700"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <radialGradient id={`${idPrefix}-aura`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#d4a44c" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#d4a44c" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#d4a44c" stopOpacity="0" />
          </radialGradient>
          <filter id={`${idPrefix}-soft`}>
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Wrap in mirror transform for right position */}
        <g transform={position === 'right' ? 'translate(400,0) scale(-1,1)' : undefined}>
          {/* Aura behind figure */}
          <motion.ellipse
            cx="200"
            cy="320"
            rx="160"
            ry="280"
            fill={`url(#${idPrefix}-aura)`}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.15, 0.3, 0.15] }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }
          />

          {/* Krishna figure — exact paths from KrishnaSilhouette.tsx */}
          <g filter={`url(#${idPrefix}-soft)`} fill="#d4a44c">
            {/* Head with crown (Mukut) */}
            <ellipse cx="200" cy="115" rx="32" ry="38" />
            {/* Crown points */}
            <path d="M175 90 L185 55 L195 80 L200 45 L205 80 L215 55 L225 90" />
            {/* Crown base */}
            <ellipse cx="200" cy="90" rx="28" ry="6" />

            {/* Peacock feather */}
            <path d="M210 60 Q225 25 215 10 Q230 30 228 55" />
            <ellipse cx="220" cy="22" rx="6" ry="10" opacity="0.7" />

            {/* Face */}
            <ellipse cx="200" cy="120" rx="26" ry="32" opacity="0.8" />

            {/* Neck */}
            <rect x="190" y="148" width="20" height="18" rx="8" />

            {/* Shoulders — tribhanga pose */}
            <path d="M160 170 Q180 160 200 166 Q220 160 240 170 L245 190 Q230 185 200 192 Q170 185 155 190 Z" />

            {/* Torso */}
            <path d="M162 190 Q170 250 180 310 Q190 320 200 318 Q210 320 220 310 Q230 250 238 190 Z" opacity="0.9" />

            {/* Left arm — holding flute up */}
            <path d="M162 190 Q140 210 125 225 Q115 235 110 240 Q108 245 112 248 L140 235 Q150 225 158 210" opacity="0.85" />
            <ellipse cx="111" cy="244" rx="8" ry="6" opacity="0.8" />

            {/* Right arm */}
            <path d="M238 190 Q255 215 265 240 Q270 250 268 255 L248 248 Q242 230 235 210" opacity="0.85" />
            <ellipse cx="268" cy="250" rx="7" ry="6" opacity="0.8" />

            {/* Flute (Bansuri) */}
            <rect x="100" y="238" width="170" height="5" rx="2.5" transform="rotate(-8 100 240)" opacity="0.7" />
            <circle cx="140" cy="238" r="1.5" opacity="0.5" />
            <circle cx="160" cy="237" r="1.5" opacity="0.5" />
            <circle cx="180" cy="236" r="1.5" opacity="0.5" />
            <circle cx="200" cy="235" r="1.5" opacity="0.5" />
            <circle cx="220" cy="234" r="1.5" opacity="0.5" />

            {/* Necklace / Vaijayanti mala */}
            <path d="M170 170 Q185 185 200 190 Q215 185 230 170" stroke="#d4a44c" strokeWidth="2.5" fill="none" opacity="0.5" />

            {/* Dhoti */}
            <path d="M175 310 Q165 400 155 500 Q150 550 160 600 Q170 650 185 680 L200 685 L215 680 Q230 650 240 600 Q250 550 245 500 Q235 400 225 310 Z" opacity="0.85" />
            <path d="M180 320 Q175 380 185 450 Q190 480 195 500" stroke="#d4a44c" strokeWidth="2" fill="none" opacity="0.5" />

            {/* Feet */}
            <ellipse cx="185" cy="685" rx="16" ry="6" opacity="0.7" />
            <ellipse cx="215" cy="685" rx="16" ry="6" opacity="0.7" />
          </g>
        </g>
      </svg>
    </motion.div>
  )
}
