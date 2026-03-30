'use client'

/**
 * DharmaFlameIcon — Animated flame SVG for the Karma Reset experience.
 * The flame is the Gita's metaphor for karma — action that illuminates.
 * Supports variable size, intensity, and color for use across phases.
 */

import React from 'react'

interface DharmaFlameIconProps {
  size?: number
  intensity?: 'dim' | 'normal' | 'bright'
  color?: string
  animate?: boolean
  className?: string
}

const OPACITY_MAP = { dim: 0.35, normal: 0.85, bright: 1.0 }

export function DharmaFlameIcon({
  size = 24,
  intensity = 'normal',
  color = '#D4A017',
  animate = true,
  className,
}: DharmaFlameIconProps) {
  const opacity = OPACITY_MAP[intensity]
  const id = `flame-grad-${size}-${color.replace('#', '')}`

  return (
    <svg
      width={size}
      height={size * 1.33}
      viewBox="0 0 48 64"
      fill="none"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {animate && (
        <style>{`
          @keyframes flameFlicker {
            0%, 100% { transform: scaleX(1) scaleY(1); }
            30% { transform: scaleX(0.95) scaleY(1.04); }
            60% { transform: scaleX(1.03) scaleY(0.97); }
          }
          .flame-animate { animation: flameFlicker 1.4s ease-in-out infinite; transform-origin: 50% 100%; }
        `}</style>
      )}
      <defs>
        <radialGradient id={id} cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.95" />
          <stop offset="35%" stopColor={color} stopOpacity="0.9" />
          <stop offset="70%" stopColor="#92400E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#050714" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={animate ? 'flame-animate' : undefined}>
        {/* Main flame body */}
        <path
          d="M24 62 C12 62 4 52 4 40 C4 28 14 20 18 12 C20 8 20 4 24 2 C24 2 26 10 28 14 C32 22 44 30 44 42 C44 54 36 62 24 62Z"
          fill={`url(#${id})`}
        />
        {/* Inner bright core */}
        <path
          d="M24 58 C18 58 14 52 14 46 C14 40 18 36 20 30 C22 34 28 38 28 46 C28 52 26 58 24 58Z"
          fill="rgba(253,230,138,0.5)"
        />
      </g>
    </svg>
  )
}
