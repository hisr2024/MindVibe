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
  /** Stagger offset (0-3) so a row of flames flickers out of sync. */
  phase?: number
  /**
   * Lite variant: drops the halo + rising spark and keeps just the flicker.
   * Used in dense layouts (like the seal screen) where stacking SVG filters
   * across many instances pushed Android WebView into GPU OOM territory.
   */
  lite?: boolean
}

const OPACITY_MAP = { dim: 0.55, normal: 0.92, bright: 1.0 }

export function DharmaFlameIcon({
  size = 24,
  intensity = 'normal',
  color = '#D4A017',
  animate = true,
  className,
  phase = 0,
  lite = false,
}: DharmaFlameIconProps) {
  const opacity = OPACITY_MAP[intensity]
  // Unique IDs per instance — multiple flames on screen must not share gradient/filter IDs.
  const baseId = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const gradId = `flame-grad-${baseId}`
  const haloId = `flame-halo-${baseId}`
  const wickId = `flame-wick-${baseId}`

  // Slight per-instance jitter on flicker tempo so a row of diyas feels alive.
  const flickerDuration = 1.25 + (phase % 4) * 0.18
  const haloDuration = 2.4 + (phase % 4) * 0.27
  const sparkDuration = 3.1 + (phase % 4) * 0.4
  const phaseDelay = -((phase % 4) * 0.31)

  return (
    <svg
      width={size}
      height={size * 1.33}
      viewBox="0 0 48 64"
      fill="none"
      className={className}
      style={{ opacity, overflow: 'visible' }}
      aria-hidden="true"
    >
      {animate && (
        <style>{`
          @keyframes flameFlicker-${baseId} {
            0%, 100% { transform: scaleX(1) scaleY(1) translateY(0); }
            18% { transform: scaleX(0.94) scaleY(1.06) translateY(-0.5px); }
            36% { transform: scaleX(1.05) scaleY(0.95) translateY(0.2px); }
            54% { transform: scaleX(0.97) scaleY(1.03) translateY(-0.3px); }
            72% { transform: scaleX(1.02) scaleY(0.98) translateY(0); }
          }
          @keyframes flameHalo-${baseId} {
            0%, 100% { opacity: 0.55; transform: scale(1); }
            50% { opacity: 0.95; transform: scale(1.12); }
          }
          @keyframes flameSpark-${baseId} {
            0% { opacity: 0; transform: translateY(0) scale(0.6); }
            30% { opacity: 0.9; }
            100% { opacity: 0; transform: translateY(-14px) scale(0.2); }
          }
          .flame-animate-${baseId} {
            animation: flameFlicker-${baseId} ${flickerDuration}s ease-in-out infinite ${phaseDelay}s;
            transform-origin: 50% 100%;
            transform-box: fill-box;
          }
          .flame-halo-${baseId} {
            animation: flameHalo-${baseId} ${haloDuration}s ease-in-out infinite ${phaseDelay}s;
            transform-origin: 50% 70%;
            transform-box: fill-box;
          }
          .flame-spark-${baseId} {
            animation: flameSpark-${baseId} ${sparkDuration}s ease-out infinite ${phaseDelay}s;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }
        `}</style>
      )}
      <defs>
        <radialGradient id={gradId} cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.98" />
          <stop offset="35%" stopColor={color} stopOpacity="0.92" />
          <stop offset="70%" stopColor="#92400E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#050714" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={haloId} cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={wickId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF7CC" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo behind the flame — skipped in lite mode */}
      {!lite && (
        <ellipse
          cx={24}
          cy={32}
          rx={22}
          ry={26}
          fill={`url(#${haloId})`}
          className={animate ? `flame-halo-${baseId}` : undefined}
        />
      )}

      <g className={animate ? `flame-animate-${baseId}` : undefined}>
        {/* Main flame body */}
        <path
          d="M24 62 C12 62 4 52 4 40 C4 28 14 20 18 12 C20 8 20 4 24 2 C24 2 26 10 28 14 C32 22 44 30 44 42 C44 54 36 62 24 62Z"
          fill={`url(#${gradId})`}
        />
        {/* Inner bright core */}
        <path
          d="M24 58 C18 58 14 52 14 46 C14 40 18 36 20 30 C22 34 28 38 28 46 C28 52 26 58 24 58Z"
          fill="rgba(253,230,138,0.55)"
        />
        {/* Brightest wick highlight */}
        <ellipse cx={24} cy={48} rx={4} ry={7} fill={`url(#${wickId})`} />
      </g>

      {/* Rising spark for liveness — skipped in lite mode */}
      {animate && !lite && (
        <circle
          cx={24}
          cy={10}
          r={1.4}
          fill="#FDE68A"
          className={`flame-spark-${baseId}`}
        />
      )}
    </svg>
  )
}
