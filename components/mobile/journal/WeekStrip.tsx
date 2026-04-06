'use client'

import { useMemo } from 'react'

interface Props {
  /** ISO date strings of entries (createdAt). */
  entryDates: string[]
  onSelectDay?: (isoDate: string) => void
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export const WeekStrip: React.FC<Props> = ({ entryDates, onSelectDay }) => {
  const days = useMemo(() => {
    const today = new Date()
    const todayKey = today.toISOString().slice(0, 10)
    // Sunday-starting week containing today
    const dayOfWeek = today.getDay()
    const start = new Date(today)
    start.setDate(today.getDate() - dayOfWeek)

    const presenceSet = new Set(entryDates.map((d) => d.slice(0, 10)))

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      return {
        key,
        letter: DAY_LETTERS[i],
        isToday: key === todayKey,
        hasEntry: presenceSet.has(key),
      }
    })
  }, [entryDates])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 14px',
        gap: 6,
      }}
    >
      {days.map((d) => (
        <button
          key={d.key}
          type="button"
          onClick={() => onSelectDay?.(d.key)}
          aria-label={`${d.key}${d.hasEntry ? ' (has entry)' : ''}`}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
            minHeight: 48,
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: d.isToday ? '#D4A017' : '#6B6355',
              fontFamily: 'Outfit, sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            {d.letter}
          </span>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: d.hasEntry ? 'rgba(212,160,23,0.2)' : 'transparent',
              border: d.isToday
                ? '1px solid #D4A017'
                : d.hasEntry
                  ? '1px solid rgba(212,160,23,0.4)'
                  : '1px dashed rgba(255,255,255,0.1)',
              color: d.isToday ? '#D4A017' : d.hasEntry ? '#F0C040' : '#6B6355',
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 13,
              boxShadow: d.isToday ? '0 0 10px rgba(212,160,23,0.35)' : 'none',
            }}
          >
            {new Date(d.key).getDate()}
          </span>
        </button>
      ))}
    </div>
  )
}
