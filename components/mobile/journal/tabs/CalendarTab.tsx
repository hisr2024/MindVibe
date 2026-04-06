'use client'

import { useMemo, useState } from 'react'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { findMood } from '../constants'

function monthMatrix(year: number, month: number): Array<Array<Date | null>> {
  const first = new Date(year, month, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: Array<Array<Date | null>> = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

export default function CalendarTab() {
  const { entries } = useJournalEntries()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const { byDay, streak, longest } = useMemo(() => {
    const map = new Map<string, typeof entries>()
    for (const e of entries) {
      const key = e.createdAt.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(e)
      map.set(key, list)
    }

    let cur = 0
    const cursor = new Date(today)
    while (map.has(cursor.toISOString().slice(0, 10))) {
      cur += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    // Longest streak
    const sortedKeys = Array.from(map.keys()).sort()
    let longestSeen = 0
    let runLen = 0
    let prev: Date | null = null
    for (const key of sortedKeys) {
      const d = new Date(key)
      if (prev) {
        const diffDays = Math.round((d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) runLen += 1
        else runLen = 1
      } else {
        runLen = 1
      }
      if (runLen > longestSeen) longestSeen = runLen
      prev = d
    }
    return { byDay: map, streak: cur, longest: longestSeen }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries])

  const rows = useMemo(() => monthMatrix(year, month), [year, month])
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  const go = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  return (
    <div style={{ background: '#050714', padding: '14px 16px 80px', minHeight: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Current streak', value: streak, hint: '🔥 days' },
          { label: 'Longest streak', value: longest, hint: '✦ days' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: 'rgba(22,26,66,0.5)',
              border: '1px solid rgba(212,160,23,0.15)',
              borderTop: '2px solid rgba(212,160,23,0.4)',
              borderRadius: 12,
              padding: '10px 8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 28,
                color: '#F0C040',
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: '#6B6355',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 4,
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 9, color: '#B8AE98', marginTop: 2 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous month"
          style={{
            background: 'none',
            border: 'none',
            color: '#D4A017',
            fontSize: 18,
            cursor: 'pointer',
            padding: '8px 12px',
          }}
        >
          ←
        </button>
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 18,
            color: '#EDE8DC',
          }}
        >
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next month"
          style={{
            background: 'none',
            border: 'none',
            color: '#D4A017',
            fontSize: 18,
            cursor: 'pointer',
            padding: '8px 12px',
          }}
        >
          →
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          marginBottom: 6,
        }}
      >
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontSize: 9,
              color: '#6B6355',
              letterSpacing: '0.1em',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {l}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
        }}
      >
        {rows.flat().map((cell, i) => {
          if (!cell) return <div key={i} />
          const key = cell.toISOString().slice(0, 10)
          const dayEntries = byDay.get(key) ?? []
          const isToday = key === today.toISOString().slice(0, 10)
          const dominant = findMood(dayEntries[0]?.mood)
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 10,
                background: dayEntries.length
                  ? 'rgba(212,160,23,0.12)'
                  : 'rgba(22,26,66,0.35)',
                border: isToday
                  ? '1px solid #D4A017'
                  : '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: isToday ? '#D4A017' : '#B8AE98',
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: 14,
              }}
            >
              {cell.getDate()}
              {dayEntries.length > 0 && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: dominant?.color ?? '#D4A017',
                    display: 'inline-block',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
