'use client'

/**
 * EmotionCircumplex Component
 *
 * Visualizes emotional state on Russell's Circumplex Model of Affect.
 * Shows valence (horizontal) and arousal (vertical) dimensions.
 *
 * Based on: Russell, J.A. (1980). A circumplex model of affect.
 */

import React, { useMemo } from 'react'
import type {
  EmotionVector,
  EmotionalQuadrant,
  GunaBalance,
  Guna,
} from '@/types/advanced-analytics.types'

interface EmotionCircumplexProps {
  vector: EmotionVector
  gunaBalance?: GunaBalance
  showLabels?: boolean
  size?: number
  className?: string
}

/** Quadrant labels */
const QUADRANT_LABELS: Record<EmotionalQuadrant, string> = {
  activated_pleasant: 'Joy, Excitement',
  activated_unpleasant: 'Anxiety, Anger',
  deactivated_pleasant: 'Calm, Content',
  deactivated_unpleasant: 'Sad, Tired',
}

/** Guna colors */
const GUNA_COLORS: Record<Guna, string> = {
  sattva: '#4CAF50', // Green - Purity
  rajas: '#FF9800', // Orange - Passion
  tamas: '#607D8B', // Blue-gray - Inertia
}

/** Guna labels */
const GUNA_LABELS: Record<Guna, string> = {
  sattva: 'Sattva (Purity)',
  rajas: 'Rajas (Passion)',
  tamas: 'Tamas (Inertia)',
}

export function EmotionCircumplex({
  vector,
  gunaBalance,
  showLabels = true,
  size = 300,
  className = '',
}: EmotionCircumplexProps) {
  // Calculate position on the grid
  const position = useMemo(() => {
    // Convert from -1,1 range to 0,size range
    const x = ((vector.valence + 1) / 2) * size
    const y = ((1 - vector.arousal) / 2) * size // Invert Y for screen coords
    return { x, y }
  }, [vector.valence, vector.arousal, size])

  // Calculate dot size based on intensity
  const dotSize = useMemo(() => {
    return 12 + vector.intensity * 16 // 12-28px
  }, [vector.intensity])

  // Get guna color
  const gunaColor = GUNA_COLORS[vector.guna]

  const center = size / 2
  const padding = 40

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* SVG Grid */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Background quadrants */}
        <rect
          x={0}
          y={0}
          width={center}
          height={center}
          fill="#FEE2E2"
          opacity={0.3}
        />
        <rect
          x={center}
          y={0}
          width={center}
          height={center}
          fill="#DCFCE7"
          opacity={0.3}
        />
        <rect
          x={0}
          y={center}
          width={center}
          height={center}
          fill="#F3F4F6"
          opacity={0.3}
        />
        <rect
          x={center}
          y={center}
          width={center}
          height={center}
          fill="#DBEAFE"
          opacity={0.3}
        />

        {/* Grid lines */}
        <line
          x1={0}
          y1={center}
          x2={size}
          y2={center}
          stroke="#9CA3AF"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <line
          x1={center}
          y1={0}
          x2={center}
          y2={size}
          stroke="#9CA3AF"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Axis labels */}
        {showLabels && (
          <>
            {/* Valence axis */}
            <text
              x={padding}
              y={center - 8}
              fontSize={10}
              fill="#6B7280"
              textAnchor="start"
            >
              Unpleasant
            </text>
            <text
              x={size - padding}
              y={center - 8}
              fontSize={10}
              fill="#6B7280"
              textAnchor="end"
            >
              Pleasant
            </text>

            {/* Arousal axis */}
            <text
              x={center + 8}
              y={padding}
              fontSize={10}
              fill="#6B7280"
              textAnchor="start"
            >
              High Arousal
            </text>
            <text
              x={center + 8}
              y={size - padding}
              fontSize={10}
              fill="#6B7280"
              textAnchor="start"
            >
              Low Arousal
            </text>

            {/* Quadrant labels */}
            <text
              x={center / 2}
              y={center / 2}
              fontSize={9}
              fill="#DC2626"
              textAnchor="middle"
              opacity={0.7}
            >
              {QUADRANT_LABELS.activated_unpleasant}
            </text>
            <text
              x={center + center / 2}
              y={center / 2}
              fontSize={9}
              fill="#16A34A"
              textAnchor="middle"
              opacity={0.7}
            >
              {QUADRANT_LABELS.activated_pleasant}
            </text>
            <text
              x={center / 2}
              y={center + center / 2}
              fontSize={9}
              fill="#6B7280"
              textAnchor="middle"
              opacity={0.7}
            >
              {QUADRANT_LABELS.deactivated_unpleasant}
            </text>
            <text
              x={center + center / 2}
              y={center + center / 2}
              fontSize={9}
              fill="#2563EB"
              textAnchor="middle"
              opacity={0.7}
            >
              {QUADRANT_LABELS.deactivated_pleasant}
            </text>
          </>
        )}

        {/* Center marker */}
        <circle
          cx={center}
          cy={center}
          r={4}
          fill="#9CA3AF"
          opacity={0.5}
        />

        {/* Emotion position dot */}
        <circle
          cx={position.x}
          cy={position.y}
          r={dotSize / 2}
          fill={gunaColor}
          opacity={0.9}
          stroke="white"
          strokeWidth={2}
        />

        {/* Pulsing animation ring */}
        <circle
          cx={position.x}
          cy={position.y}
          r={dotSize / 2 + 4}
          fill="none"
          stroke={gunaColor}
          strokeWidth={2}
          opacity={0.4}
        >
          <animate
            attributeName="r"
            from={dotSize / 2 + 4}
            to={dotSize / 2 + 16}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from={0.4}
            to={0}
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Guna indicator */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-xs">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: gunaColor }}
        />
        <span className="text-gray-600">{GUNA_LABELS[vector.guna]}</span>
      </div>

      {/* Guna balance bar (if provided) */}
      {gunaBalance && (
        <div className="absolute bottom-2 right-2 w-24">
          <div className="flex h-2 rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${gunaBalance.sattva * 100}%`,
                backgroundColor: GUNA_COLORS.sattva,
              }}
            />
            <div
              className="h-full"
              style={{
                width: `${gunaBalance.rajas * 100}%`,
                backgroundColor: GUNA_COLORS.rajas,
              }}
            />
            <div
              className="h-full"
              style={{
                width: `${gunaBalance.tamas * 100}%`,
                backgroundColor: GUNA_COLORS.tamas,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact version for inline use
 */
export function EmotionCircumplexCompact({
  vector,
  size = 80,
}: {
  vector: EmotionVector
  size?: number
}) {
  const position = useMemo(() => {
    const x = ((vector.valence + 1) / 2) * size
    const y = ((1 - vector.arousal) / 2) * size
    return { x, y }
  }, [vector.valence, vector.arousal, size])

  const dotSize = 6 + vector.intensity * 6
  const gunaColor = GUNA_COLORS[vector.guna]
  const center = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Simple grid */}
      <line
        x1={0}
        y1={center}
        x2={size}
        y2={center}
        stroke="#E5E7EB"
        strokeWidth={1}
      />
      <line
        x1={center}
        y1={0}
        x2={center}
        y2={size}
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {/* Dot */}
      <circle
        cx={position.x}
        cy={position.y}
        r={dotSize / 2}
        fill={gunaColor}
      />
    </svg>
  )
}

export default EmotionCircumplex
