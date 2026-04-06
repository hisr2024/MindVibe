'use client'

/**
 * Entry detail route. Looks up the entry by id from the hook's cached list
 * and renders the EntryDetail view (which handles client-side decryption).
 */

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useJournalEntries } from '@/hooks/useJournalEntries'
import { EntryDetail } from '@/components/mobile/journal/EntryDetail'
import { JournalSkeleton } from '@/components/mobile/journal/JournalSkeleton'

export default function JournalEntryPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { entries, isLoading } = useJournalEntries()

  const id = decodeURIComponent(params?.id ?? '')
  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id])

  return (
    <MobileAppShell showHeader={false} showTabBar={false}>
      <div style={{ background: '#050714', minHeight: '100%' }}>
        {isLoading ? (
          <div style={{ paddingTop: 24 }}>
            <JournalSkeleton rows={2} />
          </div>
        ) : entry ? (
          <EntryDetail entry={entry} onBack={() => router.back()} />
        ) : (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#B8AE98',
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
            }}
          >
            <div style={{ fontSize: 48 }}>🪷</div>
            <div style={{ marginTop: 12 }}>This reflection could not be found.</div>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                marginTop: 20,
                padding: '10px 20px',
                borderRadius: 22,
                background: 'none',
                border: '1px solid rgba(212,160,23,0.4)',
                color: '#D4A017',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </MobileAppShell>
  )
}
