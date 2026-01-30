'use client'

/**
 * KarmicRippleViz Component
 *
 * Visualizes the ripple effects of actions in concentric circles,
 * showing how karmic consequences spread across time and domains.
 */

import React, { useMemo } from 'react'
import type {
  RippleVisualizationData,
  RippleCircle,
  Guna,
} from '@/types/advanced-analytics.types'

interface KarmicRippleVizProps {
  data: RippleVisualizationData
  size?: number
  animated?: boolean
  className?: string
}

/** Guna colors for center */
const GUNA_COLORS: Record<Guna, string> = {
  sattva: '#4CAF50',
  rajas: '#FF9800',
  tamas: '#607D8B',
}

/** Intent labels */
const INTENT_LABELS: Record<string, string> = {
  sattvic: 'Pure Intent',
  rajasic: 'Passionate Intent',
  tamasic: 'Confused Intent',
}

export function KarmicRippleViz({
  data,
  size = 400,
  animated = true,
  className = '',
}: KarmicRippleVizProps) {
  const center = size / 2
  const maxRadius = (size - 60) / 2

  // Calculate ring positions
  const rings = useMemo(() => {
    return data.ripple_circles.map((ripple, index) => {
      const baseRadius = (ripple.radius / 5) * maxRadius
      return {
        ...ripple,
        calculatedRadius: Math.min(baseRadius + 20, maxRadius),
        opacity: 0.3 + ripple.intensity * 0.5,
        strokeWidth: 2 + ripple.intensity * 3,
      }
    })
  }, [data.ripple_circles, maxRadius])

  // Center color based on guna
  const centerColor = GUNA_COLORS[data.center_guna] || '#9E9E9E'

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="#F9FAFB"
          stroke="#E5E7EB"
          strokeWidth={1}
        />

        {/* Ripple rings (from outer to inner so inner draws on top) */}
        {[...rings].reverse().map((ring, index) => (
          <g key={ring.id}>
            {/* Ring circle */}
            <circle
              cx={center}
              cy={center}
              r={ring.calculatedRadius}
              fill="none"
              stroke={ring.color}
              strokeWidth={ring.strokeWidth}
              opacity={ring.opacity}
              strokeDasharray={ring.valence === 'negative' ? '8,4' : undefined}
            >
              {animated && (
                <animate
                  attributeName="r"
                  from={ring.calculatedRadius - 2}
                  to={ring.calculatedRadius + 2}
                  dur={`${2 + index * 0.5}s`}
                  repeatCount="indefinite"
                  values={`${ring.calculatedRadius - 2};${ring.calculatedRadius + 2};${ring.calculatedRadius - 2}`}
                />
              )}
            </circle>

            {/* Ring label */}
            <text
              x={center}
              y={center - ring.calculatedRadius + 15}
              fontSize={10}
              fill="#6B7280"
              textAnchor="middle"
            >
              {ring.timeframe.replace('_', ' ')}
            </text>

            {/* Effect label on the side */}
            <text
              x={center + ring.calculatedRadius - 20}
              y={center}
              fontSize={9}
              fill={ring.color}
              textAnchor="end"
              transform={`rotate(-15, ${center + ring.calculatedRadius - 20}, ${center})`}
            >
              {ring.label}
            </text>
          </g>
        ))}

        {/* Center action circle */}
        <circle
          cx={center}
          cy={center}
          r={30}
          fill={centerColor}
          opacity={0.9}
          stroke="white"
          strokeWidth={3}
        >
          {animated && (
            <animate
              attributeName="r"
              values="28;32;28"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Action icon in center */}
        <text
          x={center}
          y={center + 5}
          fontSize={20}
          fill="white"
          textAnchor="middle"
        >
          {data.center_intent === 'sattvic' ? '✦' : data.center_intent === 'rajasic' ? '◆' : '●'}
        </text>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: centerColor }} />
          <span className="text-gray-600">{INTENT_LABELS[data.center_intent]}</span>
        </div>
        <div className="flex items-center gap-1">
          {data.can_heal ? (
            <>
              <span className="text-green-600">●</span>
              <span className="text-green-600">Healable</span>
            </>
          ) : (
            <>
              <span className="text-red-600">●</span>
              <span className="text-red-600">Needs Work</span>
            </>
          )}
        </div>
      </div>

      {/* Karma weight indicator */}
      <div className="absolute top-4 right-4 text-sm">
        <div className="text-gray-500">Karma Weight</div>
        <div
          className={`text-lg font-semibold ${
            data.total_karma > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {data.total_karma > 0 ? '+' : ''}{(data.total_karma * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  )
}

/**
 * Compact ripple indicator
 */
export function KarmicRippleIndicator({
  karmaWeight,
  canHeal,
  size = 40,
}: {
  karmaWeight: number
  canHeal: boolean
  size?: number
}) {
  const color = karmaWeight > 0 ? '#4CAF50' : '#F44336'
  const center = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={center}
        cy={center}
        r={center - 4}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.3}
      />
      <circle
        cx={center}
        cy={center}
        r={center - 8}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.5}
      />
      <circle
        cx={center}
        cy={center}
        r={6}
        fill={color}
      />
      {canHeal && (
        <circle
          cx={center}
          cy={center}
          r={center - 2}
          fill="none"
          stroke="#4CAF50"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      )}
    </svg>
  )
}

export default KarmicRippleViz
