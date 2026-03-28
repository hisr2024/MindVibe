'use client'

/**
 * SacredOMLoader — Animated OM symbol loader
 *
 * Replaces generic spinners with a sacred OM (OM) that
 * draws itself via stroke-dasharray animation then glows.
 * Falls back to a simple gold pulse dot with reduced motion.
 */

import { useReducedMotion } from 'framer-motion'

interface SacredOMLoaderProps {
  size?: number
  className?: string
  /** Optional message displayed below the OM */
  message?: string
}

export function SacredOMLoader({ size = 48, className = '', message }: SacredOMLoaderProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`} role="status" aria-label="Loading">
        <div
          className="rounded-full bg-[var(--sacred-divine-gold)]"
          style={{ width: size / 3, height: size / 3, opacity: 0.6 }}
        />
        {message && (
          <p className="sacred-text-ui text-[var(--sacred-text-muted)] text-xs italic">{message}</p>
        )}
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  return (
    <div
      className={`sacred-om-loader flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-label="Loading"
      style={{ color: 'var(--sacred-divine-gold)' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 8c-4 0-7.5 2-9.5 5.5C38 17 37 21 37 26c0 6 2 11 5 15 3 3.5 6 5.5 10 6.5-2 3-5 5.5-9 7.5-5 2.5-10 3.5-15 3-4-.5-7-2-9-4.5-2-3-3-6-3-10 0-3 1-6 2.5-8.5 1.5-2 3.5-3.5 6-4.5l-2-5c-4 1.5-7 4-9 7.5C11 36 10 40 10 44c0 5 1.5 9.5 4.5 13 3 3.5 7 5.5 12 6 6 .5 12-1 17-4.5 4-3 7-6.5 9-10.5h.5c5 0 9.5-2 13-5.5 3.5-3.5 5-8 5-13 0-5.5-2-10-5.5-13.5C62 12.5 57 10.5 51.5 10L50 8zm2 7c3.5.5 6.5 2 9 4.5 2.5 3 3.5 6 3.5 10 0 4-1.5 7-4 9.5-2.5 2.5-5.5 3.5-9 3.5-1.5 0-3-.5-4-1 2-3.5 3-7.5 3-12 0-5-1-10-3.5-14.5h5zm-22 60c0 3 1 5.5 3 7.5 2 2.5 5 3.5 8 3.5 4 0 7-1.5 9.5-4l3 3.5 4-3.5-3.5-3.5c2-3 3-6.5 3-10.5H52c0 3-.5 5.5-2 7.5-1.5 2-3.5 3-6 3-1.5 0-3-.5-4-1.5-1-1.5-1.5-3-1.5-5 0-3 1-5.5 3-7.5 2-2.5 5-4 8.5-5l-1.5-5c-5 1.5-9 4-12 7.5-2.5 3-4 7-4 11z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 600,
            strokeDashoffset: 600,
          }}
        />
        {/* Chandrabindu */}
        <circle cx="58" cy="6" r="2.5" fill="currentColor" opacity="0.8" />
        <path
          d="M48 10c2-3 5-5 9-5s7 2 9 5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 40,
            strokeDashoffset: 40,
          }}
        />
      </svg>
      {message && (
        <p className="sacred-text-ui text-[var(--sacred-text-muted)] text-xs italic">{message}</p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  )
}

export default SacredOMLoader
