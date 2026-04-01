/**
 * JourneyProgressRing — SVG circular progress indicator.
 */

'use client'

import { motion } from 'framer-motion'

interface JourneyProgressRingProps {
  /** Progress percentage 0-100 */
  progress: number
  /** Diameter in px */
  size?: number
  /** Stroke width */
  strokeWidth?: number
  /** Ring color */
  color?: string
  /** Optional label inside */
  label?: string
}

export function JourneyProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = '#D4A017',
  label,
}: JourneyProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.min(progress, 100) / 100)

  // Shift color toward gold when progress > 80%
  const ringColor = progress > 80 ? '#F0C040' : color

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-medium" style={{ color: ringColor }}>
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
