/**
 * EnemyRadarMobile — Touch-interactive SVG hexagonal radar chart.
 *
 * Displays mastery levels for the 6 inner enemies in a radar visualization.
 * Each axis endpoint is tappable to select an enemy. Algorithm ported from
 * the desktop EnemyRadarChart in JourneysPageClient.tsx.
 */

'use client'

import { motion } from 'framer-motion'
import type { EnemyType, EnemyProgressResponse } from '@/types/journeyEngine.types'
import { ENEMY_INFO, ENEMY_ORDER } from '@/types/journeyEngine.types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface EnemyRadarMobileProps {
  data: EnemyProgressResponse[]
  /** Which enemy is currently tapped/selected (if any) */
  selectedEnemy?: EnemyType | null
  onEnemyTap?: (enemy: EnemyType) => void
  /** Diameter. Defaults to 280 */
  size?: number
}

function getPoint(
  index: number,
  value: number,
  center: number,
  maxRadius: number,
): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
  const r = (value / 100) * maxRadius
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
}

export function EnemyRadarMobile({
  data,
  selectedEnemy,
  onEnemyTap,
  size = 280,
}: EnemyRadarMobileProps) {
  const { triggerHaptic } = useHapticFeedback()
  const center = size / 2
  const maxRadius = size * 0.36
  const levels = 3 // concentric hexagons

  const getMastery = (enemy: string): number =>
    data.find((p) => p.enemy === enemy)?.mastery_level ?? 0

  // Data polygon path
  const points = ENEMY_ORDER.map((enemy, i) => getPoint(i, getMastery(enemy), center, maxRadius))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="mobileRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212, 160, 23, 0.25)" />
            <stop offset="100%" stopColor="rgba(200, 148, 58, 0.08)" />
          </linearGradient>
          <filter id="mobileRadarGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric hexagon rings */}
        {Array.from({ length: levels }).map((_, level) => {
          const r = ((level + 1) / levels) * maxRadius
          const hexPoints = ENEMY_ORDER.map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
            return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
          }).join(' ')
          return (
            <polygon
              key={level}
              points={hexPoints}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          )
        })}

        {/* Axis lines */}
        {ENEMY_ORDER.map((_, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(a)}
              y2={center + maxRadius * Math.sin(a)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygon */}
        <motion.path
          d={pathD}
          fill="url(#mobileRadarFill)"
          stroke="rgba(212, 160, 23, 0.6)"
          strokeWidth="1.5"
          filter="url(#mobileRadarGlow)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Data points (tappable) */}
        {ENEMY_ORDER.map((enemy, i) => {
          const mastery = getMastery(enemy)
          const p = getPoint(i, mastery, center, maxRadius)
          const info = ENEMY_INFO[enemy]
          const isSelected = selectedEnemy === enemy
          const dimmed = selectedEnemy && selectedEnemy !== enemy

          return (
            <motion.circle
              key={enemy}
              cx={p.x}
              cy={p.y}
              r={isSelected ? 8 : 5}
              fill={info.color}
              stroke="white"
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={dimmed ? 0.3 : 1}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                triggerHaptic('light')
                onEnemyTap?.(enemy)
              }}
            />
          )
        })}

        {/* Axis labels */}
        {ENEMY_ORDER.map((enemy, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          const lr = maxRadius + 28
          const x = center + lr * Math.cos(a)
          const y = center + lr * Math.sin(a)
          const info = ENEMY_INFO[enemy]
          const dimmed = selectedEnemy && selectedEnemy !== enemy

          return (
            <g
              key={`label-${enemy}`}
              opacity={dimmed ? 0.3 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                triggerHaptic('light')
                onEnemyTap?.(enemy)
              }}
            >
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] font-divine italic"
                fill={info.color}
              >
                {info.sanskrit}
              </text>
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[8px] font-ui"
                fill="rgba(255,255,255,0.4)"
              >
                {info.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
