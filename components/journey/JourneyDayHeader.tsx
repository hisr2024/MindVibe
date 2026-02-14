'use client'

/**
 * JourneyDayHeader — renders Day X / 14, a subtle progress bar,
 * today's theme, and the inner-force focus for the current day.
 *
 * Designed to sit at the top of the guided journey detail page.
 * All data comes from the static dayMeta config (offline-first).
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { getDayMeta, calculateProgress, TOTAL_JOURNEY_DAYS } from '@/lib/journey/dayMeta'
import type { JourneyDayMeta } from '@/lib/journey/dayMeta'

export interface JourneyDayHeaderProps {
  /** Current day being viewed (1-indexed) */
  currentDay: number
  /** Total days in the journey (defaults to 14) */
  totalDays?: number
  /** Number of days the user has completed */
  completedDays: number
  /** Optional className for the outer wrapper */
  className?: string
}

export function JourneyDayHeader({
  currentDay,
  totalDays = TOTAL_JOURNEY_DAYS,
  completedDays,
  className = '',
}: JourneyDayHeaderProps) {
  const dayMeta: JourneyDayMeta | undefined = useMemo(
    () => getDayMeta(currentDay),
    [currentDay]
  )

  const progress = useMemo(
    () => calculateProgress(completedDays, totalDays),
    [completedDays, totalDays]
  )

  const isFinalDay = currentDay === totalDays

  return (
    <div className={`space-y-3 ${className}`} data-testid="journey-day-header">
      {/* Day counter */}
      <div className="flex items-baseline justify-between">
        <h2
          className="text-lg font-semibold text-white tracking-tight"
          data-testid="day-counter"
        >
          Day {currentDay}{' '}
          <span className="text-white/40 font-normal">/ {totalDays}</span>
        </h2>
        <span
          className="text-xs text-white/40 tabular-nums"
          data-testid="progress-label"
        >
          {progress}%
        </span>
      </div>

      {/* Subtle thin progress bar */}
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={completedDays}
        aria-valuemin={0}
        aria-valuemax={totalDays}
        aria-label={`Journey progress: ${progress}% complete`}
        data-testid="progress-bar"
      >
        <motion.div
          className="h-full rounded-full bg-white/30"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Theme + Focus */}
      {dayMeta && (
        <div className="flex flex-col gap-1 pt-1" data-testid="day-meta">
          <p className="text-sm text-white/60" data-testid="day-theme">
            {isFinalDay ? dayMeta.theme : `Today\u2019s theme: ${dayMeta.theme}`}
          </p>
          <p className="text-xs text-white/40" data-testid="day-focus">
            Focus: {dayMeta.focus}
          </p>
        </div>
      )}
    </div>
  )
}

export default JourneyDayHeader
