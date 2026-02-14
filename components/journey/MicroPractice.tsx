'use client'

/**
 * MicroPractice — "Today's micro-practice" block with a "Mark practiced" toggle.
 *
 * Displays a 1–2 sentence practice from the day metadata and persists the
 * toggled state in IndexedDB so it survives page reloads and works offline.
 * Non-gamified: no streaks, no confetti, no celebration animation.
 */

import { useState, useEffect, useCallback } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { getDayMeta } from '@/lib/journey/dayMeta'
import { getPracticeState, setPracticeState } from '@/lib/journey/practiceState'

export interface MicroPracticeProps {
  /** Journey identifier (used as part of the IDB key) */
  journeyId: string
  /** Current day number (1-indexed) */
  day: number
  /** Optional className for the outer wrapper */
  className?: string
}

export function MicroPractice({ journeyId, day, className = '' }: MicroPracticeProps) {
  const [practiced, setPracticed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const dayMeta = getDayMeta(day)

  // Hydrate toggle state from IDB on mount
  useEffect(() => {
    let cancelled = false
    getPracticeState(journeyId, day).then((value) => {
      if (!cancelled) {
        setPracticed(value)
        setLoaded(true)
      }
    })
    return () => { cancelled = true }
  }, [journeyId, day])

  const handleToggle = useCallback(
    (checked: boolean) => {
      setPracticed(checked)
      setPracticeState(journeyId, day, checked)
    },
    [journeyId, day],
  )

  if (!dayMeta) return null

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}
      data-testid="micro-practice"
    >
      <h3
        className="text-xs font-medium uppercase tracking-wider text-white/50 mb-3"
        data-testid="micro-practice-title"
      >
        Today&apos;s micro-practice
      </h3>

      <p
        className="text-sm text-white/80 leading-relaxed mb-4"
        data-testid="micro-practice-text"
      >
        {dayMeta.microPractice}
      </p>

      <div className="flex items-center justify-between">
        <label
          htmlFor={`practice-toggle-${day}`}
          className="text-sm text-white/50 cursor-pointer select-none"
          data-testid="micro-practice-label"
        >
          Mark practiced
        </label>

        <Switch.Root
          id={`practice-toggle-${day}`}
          checked={practiced}
          onCheckedChange={handleToggle}
          disabled={!loaded}
          aria-label="Mark practiced"
          className={`relative h-6 w-11 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40 ${
            practiced
              ? 'bg-white/25 border-white/30'
              : 'bg-white/10 border-white/10'
          }`}
          data-testid="micro-practice-toggle"
        >
          <Switch.Thumb
            className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              practiced ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </Switch.Root>
      </div>
    </section>
  )
}

export default MicroPractice
