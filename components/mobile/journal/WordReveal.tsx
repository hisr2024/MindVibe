'use client'

import { WORD_STAGGER, WORD_DURATION } from './constants'

interface Props {
  text: string
  /** Delay before the first word fades in (ms). */
  initialDelay?: number
  /** Font size / family overrides. */
  style?: React.CSSProperties
}

/**
 * Dialect B canonical word-by-word reveal.
 * Each word fades + translates + unblurs in sequence.
 */
export const WordReveal: React.FC<Props> = ({ text, initialDelay = 0, style }) => {
  const words = text.split(/(\s+)/) // preserve whitespace
  return (
    <div style={style}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: `wordIn ${WORD_DURATION}ms ease-out both`,
              animationDelay: `${initialDelay + (i / 2) * WORD_STAGGER}ms`,
              opacity: 0,
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}
