/**
 * EnemySVGFallback — Sacred geometry symbol used when no AI hero image
 * has been generated yet for an enemy or a journey template.
 *
 * Renders instantly (no network), so template cards never show an empty
 * flash. Paired with a gradient backdrop in the consuming card, it keeps
 * the Journeys catalog visually intact even before designers drop in the
 * final WebP artwork under /public/images/journeys/.
 */

'use client'

import * as React from 'react'

// Each path is a visual shorthand for the enemy's energy:
//   kama    — upward flame triangle (desire rising)
//   krodha  — vajra diamond (anger / thunderbolt)
//   lobha   — grasping loop (infinite wanting)
//   moha    — enclosing circle (maya)
//   mada    — inflated star (ego)
//   matsarya — heart (envy vs. compassion)
export const ENEMY_SVG_SYMBOLS: Record<string, string> = {
  kama: 'M 50,10 L 90,80 L 10,80 Z',
  krodha: 'M 50,10 L 90,50 L 50,90 L 10,50 Z',
  lobha: 'M 10,50 Q 50,10 90,50 Q 50,90 10,50',
  moha: 'M 50,10 A 40,40 0 1 1 50,90 A 40,40 0 1 1 50,10',
  mada:
    'M 50,10 L 60,40 L 90,40 L 65,60 L 75,90 L 50,70 L 25,90 L 35,60 L 10,40 L 40,40 Z',
  matsarya: 'M 50,15 C 80,15 90,45 50,55 C 10,45 20,15 50,15',
  // Alternate spelling sometimes used in template tags.
  matsara: 'M 50,15 C 80,15 90,45 50,55 C 10,45 20,15 50,15',
}

export interface EnemySVGFallbackProps {
  enemyId: string
  color: string
  size?: number
}

export const EnemySVGFallback: React.FC<EnemySVGFallbackProps> = ({
  enemyId,
  color,
  size = 60,
}) => {
  const d = ENEMY_SVG_SYMBOLS[enemyId] ?? ENEMY_SVG_SYMBOLS.kama
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill={`${color}22`}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
