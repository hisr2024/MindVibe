'use client'

/**
 * DharmaMapChamber — The Dharma Map
 *
 * SVG radar chart visualizing 8 dharma axis values derived from guna
 * pattern selections. Axes animate from center outward with spring physics.
 * Includes auto-generated interpretation text.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { springConfigs } from '@/lib/animations/spring-configs'
import { SacredButton } from '@/components/sacred/SacredButton'
import { DHARMA_AXES } from '../data/dharmaAxes'

interface DharmaMapChamberProps {
  dharmaValues: Record<string, number>
  dominantGuna: string
  partnerName: string
  onProceed: () => void
}

/** Guna → color mapping */
const GUNA_COLORS: Record<string, string> = {
  tamas: '#3730A3',
  rajas: '#D97706',
  sattva: '#D4A017',
  balanced: '#D4A017',
}

const CENTER = 150
const MAX_R = 135

/** Convert polar (angle in degrees, radius) to cartesian SVG coords */
function polarToCart(angleDeg: number, radius: number): [number, number] {
  // Offset so 0 degrees points up (subtract 90)
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)]
}

export function DharmaMapChamber({
  dharmaValues,
  dominantGuna,
  partnerName,
  onProceed,
}: DharmaMapChamberProps) {
  const gunaColor = GUNA_COLORS[dominantGuna] ?? GUNA_COLORS.balanced

  // Compute polygon points from dharma values
  const points = useMemo(() => {
    return DHARMA_AXES.map((axis) => {
      const value = dharmaValues[axis.id] ?? 0.5
      const [x, y] = polarToCart(axis.angle, value * MAX_R)
      return { x, y, value, axis }
    })
  }, [dharmaValues])

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Find highest and lowest axes for interpretation
  const interpretation = useMemo(() => {
    let highest = points[0]
    let lowest = points[0]
    for (const p of points) {
      if (p.value > highest.value) highest = p
      if (p.value < lowest.value) lowest = p
    }
    const nameLabel = partnerName ? `with ${partnerName} ` : ''
    return `Your relationship ${nameLabel}shows strong ${highest.axis.label.toLowerCase()} (${highest.axis.sanskrit}) but diminished ${lowest.axis.label.toLowerCase()} (${lowest.axis.sanskrit}).`
  }, [points, partnerName])

  // Dominant guna Sanskrit characters
  const gunaSanskrit: Record<string, string> = {
    tamas: 'त',
    rajas: 'र',
    sattva: 'स',
    balanced: 'ॐ',
  }

  return (
    <motion.div
      className="flex flex-col items-center gap-5 px-4 pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* SVG Radar Chart */}
      <svg viewBox="0 0 300 300" className="w-full max-w-[300px]">
        <defs>
          <radialGradient id="dharma-fill">
            <stop offset="0%" stopColor={gunaColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={gunaColor} stopOpacity={0.1} />
          </radialGradient>
        </defs>

        {/* Concentric circles */}
        {[45, 90, 135].map((r) => (
          <circle
            key={r}
            cx={CENTER}
            cy={CENTER}
            r={r}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {DHARMA_AXES.map((axis) => {
          const [ex, ey] = polarToCart(axis.angle, MAX_R)
          return (
            <line
              key={axis.id}
              x1={CENTER}
              y1={CENTER}
              x2={ex}
              y2={ey}
              stroke="#ffffff"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          )
        })}

        {/* Data polygon */}
        <motion.polygon
          points={polygonPath}
          fill="url(#dharma-fill)"
          stroke={gunaColor}
          strokeWidth={1.5}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, ...springConfigs.gentle }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />

        {/* Axis end dots and labels */}
        {points.map((p) => {
          const dotColor =
            p.value > 0.7 ? '#D4A017' : p.value >= 0.4 ? '#0E7490' : '#4B5563'
          // Position labels slightly beyond the chart edge
          const [lx, ly] = polarToCart(p.axis.angle, MAX_R + 20)

          return (
            <g key={p.axis.id}>
              {/* Endpoint dot */}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={dotColor}
                initial={{ cx: CENTER, cy: CENTER, opacity: 0 }}
                animate={{ cx: p.x, cy: p.y, opacity: 1 }}
                transition={{ delay: 0.4 + points.indexOf(p) * 0.06, ...springConfigs.gentle }}
              />

              {/* English label */}
              <text
                x={lx}
                y={ly - 4}
                textAnchor="middle"
                className="font-ui"
                fill="var(--sacred-text-primary)"
                fontSize={10}
              >
                {p.axis.label}
              </text>
              {/* Sanskrit label */}
              <text
                x={lx}
                y={ly + 8}
                textAnchor="middle"
                className="font-divine"
                fill="var(--sacred-text-muted)"
                fontSize={8}
                fontStyle="italic"
              >
                {p.axis.sanskrit}
              </text>
            </g>
          )
        })}

        {/* Center guna character */}
        <motion.text
          x={CENTER}
          y={CENTER + 8}
          textAnchor="middle"
          className="font-divine"
          fill={gunaColor}
          fontSize={24}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, ...springConfigs.bouncy }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        >
          {gunaSanskrit[dominantGuna] ?? gunaSanskrit.balanced}
        </motion.text>
      </svg>

      {/* Interpretation text */}
      <motion.p
        className="font-sacred italic text-[14px] text-[var(--sacred-text-secondary)] leading-relaxed text-center px-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        {interpretation}
      </motion.p>

      {/* CTA */}
      <SacredButton variant="divine" fullWidth onClick={onProceed}>
        Receive the Gita&apos;s Wisdom
      </SacredButton>
    </motion.div>
  )
}

export default DharmaMapChamber
