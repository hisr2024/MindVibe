'use client'

/**
 * SakhaSymbol — Sacred brand identity for Sakha (The Divine Friend).
 *
 * Layers (outermost → innermost):
 *  1. Thin gold boundary ring + subtle dashed inner ring
 *  2. 8-petal lotus in divine gold (outer petals)
 *  3. 8-petal lotus in peacock teal (inner petals, rotated 22.5°)
 *  4. 3 peacock feathers rising from top (with peacock eye ovals)
 *  5. Krishna's flute — diagonal line with 6 holes
 *  6. Dark circle with gold border + OM (Cormorant Garamond)
 *  7. Subtle halo ring around the lotus
 *
 * Variant sizes control which layers render:
 *  - micro (≤32px): OM-only in gold circle
 *  - icon  (48px):  petals + OM center
 *  - compact (96px): petals + flute + feathers + OM
 *  - full (180px):  all layers with animations
 */

import React from 'react'

interface SakhaSymbolProps {
  size?: number
  variant?: 'full' | 'compact' | 'icon' | 'micro'
  animated?: boolean
  className?: string
}

const DEFAULT_SIZES: Record<string, number> = {
  full: 180,
  compact: 96,
  icon: 48,
  micro: 28,
}

export function SakhaSymbol({
  size,
  variant = 'full',
  animated = true,
  className,
}: SakhaSymbolProps) {
  const resolvedSize = size ?? DEFAULT_SIZES[variant]

  // Micro: OM-only symbol (petals too small to render)
  if (variant === 'micro' || resolvedSize <= 32) {
    return (
      <svg
        width={resolvedSize}
        height={resolvedSize}
        viewBox="0 0 360 360"
        className={className}
        aria-label="Sakha — The Divine Friend"
        role="img"
        style={{ overflow: 'visible', flexShrink: 0 }}
      >
        <defs>
          <radialGradient id="skMicroGold" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#A8760A" />
          </radialGradient>
        </defs>
        <circle
          cx="180" cy="180" r="158"
          fill="rgba(22,26,66,0.5)"
          stroke="#D4A017" strokeWidth="2" strokeOpacity="0.7"
        />
        <text
          x="180" y="192"
          textAnchor="middle" dominantBaseline="middle"
          fontFamily='"Cormorant Garamond", Georgia, serif'
          fontSize="56" fontWeight="300"
          fill="url(#skMicroGold)"
        >
          ॐ
        </text>
      </svg>
    )
  }

  const cx = 180
  const cy = 180
  const showPeacockFeathers = resolvedSize >= 96
  const showFlute = resolvedSize >= 96
  const showInnerPetals = resolvedSize >= 48

  // Unique ID prefix to avoid conflicts when multiple symbols render
  const uid = React.useId().replace(/:/g, '')

  return (
    <svg
      width={resolvedSize}
      height={resolvedSize}
      viewBox="0 0 360 360"
      className={className}
      aria-label="Sakha — The Divine Friend"
      role="img"
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`${uid}-goldCore`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#92600A" />
        </radialGradient>
        <radialGradient id={`${uid}-petalGold`} cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#F0C040" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#A8760A" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id={`${uid}-petalTeal`} cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0E7490" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`${uid}-peacockEye`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="40%" stopColor="#D4A017" />
          <stop offset="70%" stopColor="#0E7490" />
          <stop offset="100%" stopColor="#1B4FBB" />
        </radialGradient>
        {animated && (
          <style>{`
            @keyframes ${uid}-breath {
              0%,100% { opacity:.55; transform:scale(1); }
              50%      { opacity:1;   transform:scale(1.04); }
            }
            @keyframes ${uid}-omPulse {
              0%,100% { opacity:.85; transform:scale(1); }
              50%      { opacity:1;   transform:scale(1.06); }
            }
            @keyframes ${uid}-halo {
              0%,100% { opacity:.3; }
              50%      { opacity:.7; }
            }
            @keyframes ${uid}-innerRing {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            .${uid}-outer-ring { animation: ${uid}-breath 4s ease-in-out infinite; }
            .${uid}-om { animation: ${uid}-omPulse 4s ease-in-out infinite; transform-origin: ${cx}px ${cy}px; }
            .${uid}-halo { animation: ${uid}-halo 3s ease-in-out infinite; }
            .${uid}-inner-ring { animation: ${uid}-innerRing 40s linear infinite; transform-origin: ${cx}px ${cy}px; }
          `}</style>
        )}
      </defs>

      {/* Outer boundary ring */}
      <g className={animated ? `${uid}-outer-ring` : undefined}>
        <circle cx={cx} cy={cy} r="140" fill="none"
          stroke="#D4A017" strokeWidth="0.6" strokeOpacity="0.3" />
      </g>

      {/* Rotating dashed inner ring */}
      <g className={animated ? `${uid}-inner-ring` : undefined}>
        <circle cx={cx} cy={cy} r="108" fill="none"
          stroke="rgba(212,160,23,0.18)" strokeWidth="0.4" strokeDasharray="2 8" />
      </g>

      {/* Peacock feathers — 3 rising from top */}
      {showPeacockFeathers && (
        <g transform={`translate(${cx},${cy})`}>
          {/* Left feather */}
          <ellipse cx="0" cy="-115" rx="9" ry="30"
            fill={`url(#${uid}-petalTeal)`} opacity="0.5"
            transform="rotate(-30)" />
          <ellipse cx="0" cy="-128" rx="7" ry="8"
            fill={`url(#${uid}-peacockEye)`} opacity="0.8"
            transform="rotate(-30)" />
          {/* Center feather (tallest) */}
          <ellipse cx="0" cy="-118" rx="10" ry="33"
            fill={`url(#${uid}-petalTeal)`} opacity="0.65" />
          <ellipse cx="0" cy="-132" rx="8" ry="9"
            fill={`url(#${uid}-peacockEye)`} opacity="0.9" />
          {/* Right feather */}
          <ellipse cx="0" cy="-115" rx="9" ry="30"
            fill={`url(#${uid}-petalTeal)`} opacity="0.5"
            transform="rotate(30)" />
          <ellipse cx="0" cy="-128" rx="7" ry="8"
            fill={`url(#${uid}-peacockEye)`} opacity="0.8"
            transform="rotate(30)" />
        </g>
      )}

      {/* Outer 8-petal lotus — Divine Gold */}
      <g transform={`translate(${cx},${cy})`}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={angle}
            cx="0" cy="-76" rx="10" ry="26"
            fill={`url(#${uid}-petalGold)`}
            opacity={i % 2 === 0 ? 0.85 : 0.75}
            transform={`rotate(${angle})`}
          />
        ))}
      </g>

      {/* Inner 8-petal lotus — Peacock Teal (rotated 22.5°) */}
      {showInnerPetals && (
        <g transform={`translate(${cx},${cy})`}>
          {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
            <ellipse
              key={angle}
              cx="0" cy="-55" rx="7" ry="18"
              fill={`url(#${uid}-petalTeal)`}
              opacity={i % 2 === 0 ? 0.7 : 0.6}
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
      )}

      {/* Krishna's flute */}
      {showFlute && (
        <g transform={`translate(${cx},${cy})`}>
          {/* Flute body */}
          <line x1="-8" y1="-28" x2="36" y2="54"
            stroke={`url(#${uid}-goldCore)`} strokeWidth="5"
            strokeLinecap="round" opacity="0.85" />
          {/* Flute highlight */}
          <line x1="-6" y1="-24" x2="38" y2="58"
            stroke="#FDE68A" strokeWidth="1"
            strokeLinecap="round" opacity="0.35" />
          {/* 6 finger holes */}
          {[
            [-3, -16], [3, -5], [9, 6], [15, 17], [21, 28], [27, 39],
          ].map(([hx, hy], i) => (
            <circle key={i} cx={hx} cy={hy} r="2.8"
              fill="none" stroke="#D4A017" strokeWidth="1.2" opacity="0.75" />
          ))}
        </g>
      )}

      {/* Halo ring */}
      <g className={animated ? `${uid}-halo` : undefined}>
        <circle cx={cx} cy={cy} r="90" fill="none"
          stroke="#F0C040" strokeWidth="1.5" strokeOpacity="0.35" />
      </g>

      {/* Center circle background */}
      <circle cx={cx} cy={cy} r="34" fill="rgba(5,7,20,0.88)"
        stroke="#D4A017" strokeWidth="1.5" strokeOpacity="0.75" />
      <circle cx={cx} cy={cy} r="30" fill="none"
        stroke="#D4A017" strokeWidth="0.4" strokeOpacity="0.35" />

      {/* OM — the seed of all */}
      <text
        className={animated ? `${uid}-om` : undefined}
        x={cx} y={cy + 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily='"Cormorant Garamond", Georgia, serif'
        fontSize="32"
        fontWeight="300"
        fill={`url(#${uid}-goldCore)`}
      >
        ॐ
      </text>
    </svg>
  )
}

export default SakhaSymbol
