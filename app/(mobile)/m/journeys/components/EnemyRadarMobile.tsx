/**
 * EnemyRadarMobile — Touch-interactive SVG hexagonal radar chart.
 *
 * Displays mastery levels for the 6 inner enemies with draw-in animation,
 * tappable endpoint circles, and Devanagari axis labels.
 */

'use client'

import { motion } from 'framer-motion'
import type { EnemyType, EnemyProgressResponse } from '@/types/journeyEngine.types'
import { ENEMY_INFO, ENEMY_ORDER } from '@/types/journeyEngine.types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface EnemyRadarMobileProps {
  data: EnemyProgressResponse[]
  selectedEnemy?: EnemyType | null
  onEnemyTap?: (enemy: EnemyType) => void
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
  size = 300,
}: EnemyRadarMobileProps) {
  const { triggerHaptic } = useHapticFeedback()
  const center = size / 2
  const maxRadius = size * 0.34
  const levels = 3

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

        {/* Axis lines with draw-in */}
        {ENEMY_ORDER.map((enemy, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          const info = ENEMY_INFO[enemy]
          return (
            <motion.line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(a)}
              y2={center + maxRadius * Math.sin(a)}
              stroke={selectedEnemy === enemy ? `${info.color}40` : 'rgba(255,255,255,0.05)'}
              strokeWidth={selectedEnemy === enemy ? 1.5 : 1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
            />
          )
        })}

        {/* Data polygon with draw-in */}
        <motion.path
          d={pathD}
          fill="url(#mobileRadarFill)"
          stroke="rgba(212, 160, 23, 0.6)"
          strokeWidth="1.5"
          filter="url(#mobileRadarGlow)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{
            opacity: 1,
            scale: [0.3, 1.02, 1],
          }}
          transition={{
            duration: 0.8,
            delay: 0.4,
            ease: [0.25, 0.1, 0.0, 1.0],
          }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Data points (tappable) with pop-in animation */}
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
              r={isSelected ? 9 : 5}
              fill={info.color}
              stroke={isSelected ? 'white' : `${info.color}80`}
              strokeWidth={isSelected ? 2.5 : 1.5}
              opacity={dimmed ? 0.3 : 1}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isSelected ? [0, 1.2, 1] : [0, 1.1, 1],
                opacity: dimmed ? 0.3 : 1,
              }}
              transition={{
                duration: 0.4,
                delay: 0.6 + i * 0.08,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                triggerHaptic('light')
                onEnemyTap?.(enemy)
              }}
            />
          )
        })}

        {/* Axis labels with Devanagari */}
        {ENEMY_ORDER.map((enemy, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          const lr = maxRadius + 30
          const x = center + lr * Math.cos(a)
          const y = center + lr * Math.sin(a)
          const info = ENEMY_INFO[enemy]
          const dimmed = selectedEnemy && selectedEnemy !== enemy

          return (
            <g
              key={`label-${enemy}`}
              opacity={dimmed ? 0.3 : 1}
              style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
              onClick={() => {
                triggerHaptic('light')
                onEnemyTap?.(enemy)
              }}
            >
              <text
                x={x}
                y={y - 7}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px]"
                style={{ fontFamily: '"Noto Sans Devanagari", sans-serif' }}
                fill={info.color}
              >
                {info.devanagari}
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
