'use client'

/**
 * SacredProgressFlames — Flame/lotus progress indicator for N steps
 *
 * Renders a horizontal row of SVG icons. Completed steps glow divine-gold,
 * the current step pulses with sacred-divine-breath, future steps are muted.
 */

interface SacredProgressFlamesProps {
  total: number
  current: number
  type?: 'flame' | 'lotus'
}

const FLAME_PATH =
  'M12 2C12 2 7 8.5 7 13a5 5 0 0 0 10 0C17 8.5 12 2 12 2Zm0 16a3 3 0 0 1-3-3c0-2.5 3-7 3-7s3 4.5 3 7a3 3 0 0 1-3 3Z'

const LOTUS_PATH =
  'M12 3C12 3 8 8 8 12a4 4 0 0 0 4 4 4 4 0 0 0 4-4C16 8 12 3 12 3ZM6 10c-1.5 2-2 4.5-.5 6s4 .5 5-1c-2 0-3.5-1.5-4.5-5ZM18 10c1.5 2 2 4.5.5 6s-4 .5-5-1c2 0 3.5-1.5 4.5-5Z'

export function SacredProgressFlames({
  total,
  current,
  type = 'flame',
}: SacredProgressFlamesProps) {
  const path = type === 'flame' ? FLAME_PATH : LOTUS_PATH

  return (
    <div className="flex items-center justify-center gap-3" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => {
        const isCompleted = i < current
        const isCurrent = i === current

        return (
          <svg
            key={i}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={isCurrent ? 'sacred-divine-breath' : ''}
            aria-label={isCompleted ? `Step ${i + 1} complete` : isCurrent ? `Step ${i + 1} current` : `Step ${i + 1}`}
          >
            <path
              d={path}
              fill={isCompleted || isCurrent ? '#D4A017' : '#6B6355'}
              opacity={isCompleted ? 1 : isCurrent ? 0.9 : 0.35}
            />
            {/* Glow filter for completed steps */}
            {isCompleted && (
              <path
                d={path}
                fill="#D4A017"
                opacity={0.3}
                filter="blur(3px)"
              />
            )}
          </svg>
        )
      })}
    </div>
  )
}

export default SacredProgressFlames
