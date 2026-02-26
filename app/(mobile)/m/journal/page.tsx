'use client'

/**
 * Mobile Journal Page
 *
 * Sacred reflections journal with voice input support.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { MobileJournal, JournalEntry } from '@/components/mobile/MobileJournal'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

export default function MobileJournalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [prefillContent, setPrefillContent] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  // Check for prefill content from KIAAN or other sources
  useEffect(() => {
    const shouldPrefill = searchParams.get('prefill') === 'true'

    if (shouldPrefill && typeof window !== 'undefined') {
      const stored = localStorage.getItem('journal_prefill')
      if (stored) {
        try {
          const data = JSON.parse(stored)
          setPrefillContent(data.body)
          // Clear prefill data after reading
          localStorage.removeItem('journal_prefill')
        } catch {
          // Ignore parsing errors
        }
      }
    }
  }, [searchParams])

  // Save journal entry
  const handleSave = useCallback(async (entry: JournalEntry) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setIsSaving(true)

    try {
      // Use blob endpoint for simple journal storage
      // The backend's /journal/blob endpoint accepts a JSON string
      const journalData = {
        type: 'journal_entry',
        title: entry.title,
        content: entry.body,
        tags: entry.tags,
        mood: entry.mood,
        created_at: entry.createdAt,
        updated_at: entry.updatedAt,
      }

      const response = await apiFetch('/api/journal/blob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blob_json: JSON.stringify(journalData),
        }),
      })

      if (response.ok) {
        triggerHaptic('success')
        // Navigate back
        router.back()
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error)
      triggerHaptic('error')
      throw error // Re-throw so MobileJournal can handle it
    } finally {
      setIsSaving(false)
    }
  }, [isAuthenticated, router, triggerHaptic])

  // Handle close
  const handleClose = useCallback(() => {
    router.back()
  }, [router])

  return (
    <MobileAppShell
      showHeader={false}
      showTabBar={false}
    >
      <MobileJournal
        onSave={handleSave}
        onClose={handleClose}
        prefillContent={prefillContent}
        className="flex-1 min-h-0"
      />
    </MobileAppShell>
  )
}
