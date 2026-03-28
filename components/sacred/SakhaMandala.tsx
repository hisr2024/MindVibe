'use client'

/**
 * SakhaMandala — Sacred geometric mandala avatar for SAKHA
 *
 * SVG-based Sri Yantra inspired design with:
 * - 5 concentric rings (outer ring rotates at 60s)
 * - Inner golden geometric pattern
 * - divine-breath golden aura animation
 * - Peacock teal accents at cardinal points
 */

import { useReducedMotion } from 'framer-motion'

interface SakhaMandalaProps {
  size?: number
  animated?: boolean
  glowIntensity?: 'low' | 'medium' | 'high'
  className?: string
}

const GLOW_MAP = {
  low: 'sacred-divine-breath',
  medium: 'sacred-divine-breath',
  high: 'sacred-divine-breath',
}

export function SakhaMandala({
  size = 80,
  animated = true,
  glowIntensity = 'medium',
  className = '',
}: SakhaMandalaProps) {
  const reduceMotion = useReducedMotion()
  const shouldAnimate = animated && !reduceMotion

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${
        shouldAnimate ? GLOW_MAP[glowIntensity] : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle cx="50" cy="50" r="48" fill="url(#mandala-bg)" />

        {/* Ring 5 (outermost) — rotates slowly */}
        <g
          style={shouldAnimate ? {
            transformOrigin: '50px 50px',
            animation: 'chakraRotate 60s linear infinite',
          } : undefined}
        >
          <circle cx="50" cy="50" r="46" style={{ stroke: 'var(--sacred-divine-gold)' }} strokeWidth="0.5" opacity="0.3" />
          {/* Sanskrit aksharas at cardinal points — simplified as dots */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180
            const x = 50 + 46 * Math.cos(rad)
            const y = 50 + 46 * Math.sin(rad)
            return (
              <circle
                key={angle}
                cx={x}
                cy={y}
                r="1"
                style={{ fill: angle % 90 === 0 ? 'var(--sacred-peacock-iridescent)' : 'var(--sacred-divine-gold)' }}
                opacity="0.7"
              />
            )
          })}
        </g>

        {/* Ring 4 */}
        <circle cx="50" cy="50" r="38" style={{ stroke: 'var(--sacred-divine-gold)' }} strokeWidth="0.5" opacity="0.4" />

        {/* Ring 3 */}
        <circle cx="50" cy="50" r="30" style={{ stroke: 'var(--sacred-divine-gold-bright)' }} strokeWidth="0.5" opacity="0.5" />

        {/* Ring 2 */}
        <circle cx="50" cy="50" r="22" style={{ stroke: 'var(--sacred-divine-gold)' }} strokeWidth="0.5" opacity="0.6" />

        {/* Ring 1 (innermost) */}
        <circle cx="50" cy="50" r="15" style={{ stroke: 'var(--sacred-divine-gold-bright)' }} strokeWidth="0.75" opacity="0.7" />

        {/* Inner Sri Yantra triangles (simplified) */}
        <polygon
          points="50,28 66,62 34,62"
          style={{ stroke: 'var(--sacred-divine-gold)' }}
          strokeWidth="0.75"
          fill="none"
          opacity="0.6"
        />
        <polygon
          points="50,72 34,38 66,38"
          style={{ stroke: 'var(--sacred-peacock-iridescent)' }}
          strokeWidth="0.75"
          fill="none"
          opacity="0.5"
        />

        {/* Center bindu (golden point) */}
        <circle cx="50" cy="50" r="4" style={{ fill: 'var(--sacred-divine-gold-glow)' }} opacity="0.9" />
        <circle cx="50" cy="50" r="2" style={{ fill: 'var(--sacred-divine-gold-glow)' }} opacity="0.9" />

        {/* Peacock teal accents at cardinal points */}
        <circle cx="50" cy="4" r="2" style={{ fill: 'var(--sacred-peacock-iridescent)' }} opacity="0.6" />
        <circle cx="96" cy="50" r="2" style={{ fill: 'var(--sacred-peacock-iridescent)' }} opacity="0.6" />
        <circle cx="50" cy="96" r="2" style={{ fill: 'var(--sacred-peacock-iridescent)' }} opacity="0.6" />
        <circle cx="4" cy="50" r="2" style={{ fill: 'var(--sacred-peacock-iridescent)' }} opacity="0.6" />

        {/* Background circle gradient — uses inline stops with CSS vars */}
        <defs>
          <radialGradient id="mandala-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: 'var(--sacred-krishna-blue)' }} stopOpacity="0.3" />
            <stop offset="60%" style={{ stopColor: 'var(--sacred-yamuna-mid)' }} stopOpacity="0.8" />
            <stop offset="100%" style={{ stopColor: 'var(--sacred-cosmic-void)' }} stopOpacity="0.95" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

export default SakhaMandala
