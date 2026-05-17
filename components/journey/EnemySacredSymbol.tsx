/**
 * EnemySacredSymbol — SVG sacred geometry symbols for each inner enemy.
 *
 * Pure SVG — no images needed, no loading, infinite resolution.
 * Used as: fallback icons, card backgrounds, radar chart overlays.
 * Each enemy has a distinct sacred symbol drawn as SVG paths.
 */

'use client'

import type { EnemyType } from '@/types/journeyEngine.types'

interface EnemySacredSymbolProps {
  enemy: EnemyType
  size?: number
  className?: string
  opacity?: number
}

/**
 * SVG path data for each enemy's sacred symbol.
 * Kama = flame (desire), Krodha = lightning bolt (anger),
 * Lobha = open hand (greed→giving), Moha = third eye (delusion→clarity),
 * Mada = crown dissolving (ego), Matsarya = two rivers merging (envy→unity).
 */
const ENEMY_SYMBOLS: Record<EnemyType, { paths: string[]; viewBox: string }> = {
  kama: {
    viewBox: '0 0 48 48',
    paths: [
      // Flame shape — desire burning
      'M24 4 C20 10 14 16 14 26 C14 34 18 40 24 44 C30 40 34 34 34 26 C34 16 28 10 24 4Z',
      // Inner flame — the eternal light within
      'M24 16 C22 20 19 24 19 29 C19 33 21 36 24 38 C27 36 29 33 29 29 C29 24 26 20 24 16Z',
    ],
  },
  krodha: {
    viewBox: '0 0 48 48',
    paths: [
      // Lightning bolt — reactive anger
      'M28 4 L18 22 L24 22 L20 44 L34 20 L27 20 L32 4Z',
      // Small circle at center — the still point
      'M24 22 C22.5 22 21.5 23 21.5 24.5 C21.5 26 22.5 27 24 27 C25.5 27 26.5 26 26.5 24.5 C26.5 23 25.5 22 24 22Z',
    ],
  },
  lobha: {
    viewBox: '0 0 48 48',
    paths: [
      // Open palm — generosity over greed
      'M24 40 L24 24 M24 24 L18 14 M24 24 L22 12 M24 24 L26 12 M24 24 L30 14',
      // Base arc — the hand's cup
      'M14 28 C14 36 18 42 24 44 C30 42 34 36 34 28',
      // Radiating lines — giving outward
      'M12 22 L8 18 M36 22 L40 18 M16 16 L12 10 M32 16 L36 10',
    ],
  },
  moha: {
    viewBox: '0 0 48 48',
    paths: [
      // Third eye — piercing through delusion
      'M24 14 C16 14 10 24 10 24 C10 24 16 34 24 34 C32 34 38 24 38 24 C38 24 32 14 24 14Z',
      // Iris
      'M24 18 C20.7 18 18 20.7 18 24 C18 27.3 20.7 30 24 30 C27.3 30 30 27.3 30 24 C30 20.7 27.3 18 24 18Z',
      // Pupil — the bindu (point of clarity)
      'M24 21 C22.3 21 21 22.3 21 24 C21 25.7 22.3 27 24 27 C25.7 27 27 25.7 27 24 C27 22.3 25.7 21 24 21Z',
    ],
  },
  mada: {
    viewBox: '0 0 48 48',
    paths: [
      // Crown dissolving — ego shedding
      'M12 24 L18 10 L24 18 L30 10 L36 24',
      // Circle below — the humble self
      'M24 26 C19.6 26 16 29.6 16 34 C16 38.4 19.6 42 24 42 C28.4 42 32 38.4 32 34 C32 29.6 28.4 26 24 26Z',
      // Downward arrow — bowing
      'M24 18 L24 26 M20 22 L24 26 L28 22',
    ],
  },
  matsarya: {
    viewBox: '0 0 48 48',
    paths: [
      // Two rivers merging — from comparison to unity
      'M8 10 C12 16 16 22 24 28 M40 10 C36 16 32 22 24 28',
      // Confluence point expanding into one river
      'M24 28 C24 28 20 34 20 38 C20 42 22 44 24 44 C26 44 28 42 28 38 C28 34 24 28 24 28Z',
      // Stars — celebrating together
      'M14 8 L15 11 L18 11 L15.5 13 L16.5 16 L14 14 L11.5 16 L12.5 13 L10 11 L13 11Z',
      'M34 8 L35 11 L38 11 L35.5 13 L36.5 16 L34 14 L31.5 16 L32.5 13 L30 11 L33 11Z',
    ],
  },
}

const ENEMY_COLORS: Record<EnemyType, string> = {
  kama: '#DC2626',
  krodha: '#B45309',
  lobha: '#059669',
  moha: '#6D28D9',
  mada: '#1D4ED8',
  matsarya: '#9D174D',
}

export function EnemySacredSymbol({
  enemy,
  size = 48,
  className = '',
  opacity = 0.35,
}: EnemySacredSymbolProps) {
  const symbol = ENEMY_SYMBOLS[enemy]
  const color = ENEMY_COLORS[enemy]

  return (
    <svg
      width={size}
      height={size}
      viewBox={symbol.viewBox}
      fill="none"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {symbol.paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={i === 0 ? `${color}15` : 'none'}
        />
      ))}
    </svg>
  )
}
