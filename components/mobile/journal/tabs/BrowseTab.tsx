'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { MOOD_OPTIONS } from '../constants'
import { EntryCard } from '../EntryCard'
import { WeekStrip } from '../WeekStrip'
import { JournalSkeleton } from '../JournalSkeleton'

export default function BrowseTab() {
  const router = useRouter()
  const { filtered, isLoading, search, setSearch, moodFilter, setMoodFilter, entries } =
    useJournalEntries()

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.createdAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
    // Current streak — consecutive days up to today with at least one entry
    const daysWithEntries = new Set(entries.map((e) => e.createdAt.slice(0, 10)))
    let streak = 0
    const cursor = new Date(now)
    while (daysWithEntries.has(cursor.toISOString().slice(0, 10))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return { total: entries.length, thisMonth, streak }
  }, [entries])

  const entryDates = useMemo(() => entries.map((e) => e.createdAt), [entries])

  return (
    <div style={{ background: '#050714', minHeight: '100%', paddingBottom: 80 }}>
      <div style={{ padding: '14px 16px 4px' }}>
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 20,
            fontStyle: 'italic',
            color: '#EDE8DC',
          }}
        >
          Your Reflections
        </div>
        <div
          style={{
            fontFamily: '"Noto Sans Devanagari", sans-serif',
            fontSize: 11,
            color: '#D4A017',
            marginTop: 2,
            lineHeight: 1.5,
          }}
        >
          आत्म-चिंतन
        </div>
      </div>

      <WeekStrip entryDates={entryDates} />

      <div style={{ display: 'flex', gap: 8, padding: '2px 14px 10px' }}>
        {[
          { label: 'Total', value: stats.total, hint: 'reflections' },
          { label: 'This month', value: stats.thisMonth, hint: 'entries' },
          { label: 'Streak', value: stats.streak, hint: '🔥 days' },
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
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 9, color: '#B8AE98', marginTop: 2 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 14px 8px' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your reflections…"
          aria-label="Search journal entries"
          style={{
            width: '100%',
            height: 42,
            borderRadius: 12,
            background: 'rgba(22,26,66,0.55)',
            border: '1px solid rgba(212,160,23,0.15)',
            color: '#EDE8DC',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 13,
            padding: '0 14px',
            outline: 'none',
          }}
        />
      </div>

      <div
        role="radiogroup"
        aria-label="Mood filter"
        className="scroll-x"
        style={{
          display: 'flex',
          gap: 6,
          padding: '0 14px 12px',
          overflowX: 'auto',
        }}
      >
        {[{ id: 'all', label: 'All', emoji: '✦' }, ...MOOD_OPTIONS].map((m) => {
          const isSelected = moodFilter === m.id
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setMoodFilter(m.id)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                minHeight: 36,
                borderRadius: 18,
                background: isSelected
                  ? 'rgba(212,160,23,0.14)'
                  : 'rgba(22,26,66,0.4)',
                border: `1px solid ${
                  isSelected ? 'rgba(212,160,23,0.4)' : 'rgba(255,255,255,0.08)'
                }`,
                color: isSelected ? '#F0C040' : '#B8AE98',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 11,
                cursor: 'pointer',
                touchAction: 'manipulation',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ fontSize: 13 }}>{m.emoji}</span>
              {m.label}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '0 14px' }}>
        {isLoading ? (
          <JournalSkeleton rows={3} />
        ) : filtered.length === 0 ? (
          <div
            style={{
              marginTop: 40,
              textAlign: 'center',
              padding: '24px 32px',
            }}
          >
            <div style={{ fontSize: 60 }}>🪷</div>
            <div
              style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: 20,
                color: '#EDE8DC',
                marginTop: 12,
                lineHeight: 1.4,
              }}
            >
              Your sacred library awaits your first offering
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#B8AE98',
                fontFamily: '"Crimson Text", serif',
                fontStyle: 'italic',
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              Return to the Editor tab to begin.
            </div>
          </div>
        ) : (
          filtered.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onOpen={(id) => router.push(`/m/journal/${encodeURIComponent(id)}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}
