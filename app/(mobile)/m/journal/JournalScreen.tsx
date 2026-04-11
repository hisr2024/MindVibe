'use client'

/**
 * JournalScreen — 4-tab orchestrator for Sacred Reflections mobile.
 *
 * Tabs: Editor | Browse | KIAAN | Calendar.
 * Pattern mirrors app/(mobile)/m/karmalytix/page.tsx (Dialect B).
 *
 * Cross-tab navigation uses window.location.hash so the KIAAN tab can
 * deep-link into the Editor after pre-filling a prompt via localStorage.
 */

import { useEffect, useState } from 'react'
import EditorTab from '@/components/mobile/journal/tabs/EditorTab'
import BrowseTab from '@/components/mobile/journal/tabs/BrowseTab'
import KIAANTab from '@/components/mobile/journal/tabs/KIAANTab'
import CalendarTab from '@/components/mobile/journal/tabs/CalendarTab'

const TABS = [
  { id: 'editor', label: 'Editor', sa: 'लेख' },
  { id: 'browse', label: 'Browse', sa: 'पठन' },
  { id: 'kiaan', label: 'KIAAN', sa: 'बोध' },
  { id: 'calendar', label: 'Calendar', sa: 'तिथि' },
] as const

type TabId = (typeof TABS)[number]['id']

function isTabId(v: string): v is TabId {
  return TABS.some((t) => t.id === v)
}

export default function JournalScreen() {
  const [tab, setTab] = useState<TabId>('editor')

  // Hash-based tab sync (KIAAN → Editor hand-off, deep links)
  useEffect(() => {
    const apply = () => {
      const h = window.location.hash.replace('#', '')
      if (isTabId(h)) setTab(h)
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [])

  const handleTabChange = (id: TabId) => {
    setTab(id)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.hash = id
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div style={{ background: '#050714', minHeight: '100vh', position: 'relative' }}>
      <div
        role="tablist"
        aria-label="Journal sections"
        style={{
          display: 'flex',
          margin: '10px 14px 6px',
          background: 'rgba(11,14,42,0.7)',
          borderRadius: 12,
          padding: 3,
          border: '1px solid rgba(212,160,23,0.12)',
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabChange(t.id)}
              style={{
                flex: 1,
                padding: '8px 4px',
                minHeight: 48,
                borderRadius: 10,
                border: active
                  ? '1px solid rgba(212,160,23,0.3)'
                  : '1px solid transparent',
                background: active ? 'rgba(212,160,23,0.12)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                touchAction: 'manipulation',
              }}
            >
              <span
                style={{
                  fontFamily: '"Noto Sans Devanagari", sans-serif',
                  fontSize: 11,
                  color: active ? '#F0C040' : '#6B6355',
                  lineHeight: 1.5,
                }}
              >
                {t.sa}
              </span>
              <span
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  color: active ? '#D4A017' : '#6B6355',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      <div>
        {tab === 'editor' && <EditorTab />}
        {tab === 'browse' && <BrowseTab />}
        {tab === 'kiaan' && <KIAANTab />}
        {tab === 'calendar' && <CalendarTab />}
      </div>
    </div>
  )
}
