'use client'

/**
 * Offline-Capable Mood Check-In Component
 *
 * Features:
 * - Works offline with operation queueing
 * - Auto-syncs when connection restored
 * - Shows sync status to user
 * - Integrates with KIAAN empathetic responses
 * - Saves to backend (moods API) when online
 * - Stores in IndexedDB when offline
 *
 * Quantum Coherence: Maintains state consistency even during network decoherence
 */

import { useState, useEffect } from 'react'
import { useOfflineMode } from '@/lib/offline/hooks/useOfflineMode'
import { apiFetch } from '@/lib/api'
import { AlertCircle, CheckCircle2, Cloud, CloudOff, Loader2 } from 'lucide-react'

const MOOD_STATES = [
  { value: 10, label: 'Excellent', color: 'green' },
  { value: 8, label: 'Good', color: 'blue' },
  { value: 5, label: 'Neutral', color: 'gray' },
  { value: 3, label: 'Low', color: 'yellow' },
  { value: 1, label: 'Very Low', color: 'red' },
]

// KIAAN empathetic micro-responses
const MOOD_RESPONSES: Record<number, string> = {
  10: "That's wonderful! I'm so glad you're feeling this way. 💙",
  8: "It's beautiful to feel good. I'm here to support your journey. 💙",
  5: "I'm here with you. Sometimes neutral is exactly where we need to be. 💙",
  3: "I see you, and I'm here. You're not alone in this. 💙",
  1: "I'm here with you through this difficult moment. You matter. 💙",
}

interface MoodData {
  score: number
  tags?: string[]
  note?: string
}

interface OfflineMoodCheckInProps {
  userId: string
  onMoodSaved?: (moodId: string) => void
  showSyncStatus?: boolean
  compact?: boolean
}

export function OfflineMoodCheckIn({
  userId,
  onMoodSaved,
  showSyncStatus = true,
  compact = false
}: OfflineMoodCheckInProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showResponse, setShowResponse] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'queued'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    isOnline,
    queueOperation,
    syncNow,
    queueCount,
    syncInProgress
  } = useOfflineMode()

  // Auto-hide KIAAN response after 4 seconds
  useEffect(() => {
    if (showResponse) {
      const timer = setTimeout(() => setShowResponse(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [showResponse])

  // Auto-hide save status after 3 seconds
  useEffect(() => {
    if (saveStatus === 'success' || saveStatus === 'queued') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const handleMoodSelect = (score: number) => {
    setSelectedScore(score)
    setShowResponse(true)
    setSaveStatus('idle')
    setErrorMessage(null)
  }

  const handleSaveMood = async () => {
    if (selectedScore === null) {
      setErrorMessage('Please select a mood before saving')
      return
    }

    setSaving(true)
    setSaveStatus('idle')
    setErrorMessage(null)

    const moodData: MoodData = {
      score: selectedScore,
      tags: tags.length > 0 ? tags : undefined,
      note: note.trim() || undefined
    }

    try {
      if (isOnline) {
        // Try to save directly to backend
        try {
          const response = await apiFetch(
            '/api/moods',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(moodData)
            },
            userId
          )

          const data = await response.json()
          setSaveStatus('success')

          if (onMoodSaved && data.id) {
            onMoodSaved(data.id.toString())
          }

          // Reset form
          resetForm()
        } catch (apiError) {
          // Online but API failed - queue for later
          console.warn('API save failed, queueing offline:', apiError)
          await queueOffline(moodData)
        }
      } else {
        // Offline - queue immediately
        await queueOffline(moodData)
      }
    } catch (error) {
      console.error('Failed to save mood:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save mood')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const queueOffline = async (moodData: MoodData) => {
    await queueOperation({
      endpoint: '/api/moods',
      method: 'POST',
      body: moodData,
      entityType: 'mood',
      userId
    })

    setSaveStatus('queued')
    resetForm()
  }

  const resetForm = () => {
    setSelectedScore(null)
    setNote('')
    setTags([])
    setShowResponse(false)
  }

  const handleTagToggle = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const commonTags = ['work', 'family', 'health', 'relationships', 'stress', 'gratitude']

  return (
    <div className={`space-y-4 ${compact ? 'p-4' : 'p-6 md:p-8'} rounded-3xl border border-orange-500/15 bg-black/50 shadow-[0_20px_80px_rgba(255,115,39,0.12)]`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold text-orange-50`}>
            Mood Check-In
          </h2>

          {/* Sync Status Indicator */}
          {showSyncStatus && (
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                  <CloudOff className="h-3.5 w-3.5" />
                  <span>Offline</span>
                </div>
              )}

              {queueCount > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
                  <span>{queueCount} queued</span>
                </div>
              )}
            </div>
          )}
        </div>

        {!compact && (
          <p className="text-sm text-orange-100/80">
            {isOnline
              ? 'Your mood will be saved immediately'
              : 'Your mood will be saved locally and synced when you\'re back online'
            }
          </p>
        )}
      </div>

      {/* Mood Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-orange-50">How are you feeling?</h3>
        <div className="flex flex-wrap gap-2">
          {MOOD_STATES.map(mood => (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood.value)}
              disabled={saving}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                selectedScore === mood.value
                  ? 'border-orange-400 bg-orange-500/30 text-orange-50 ring-2 ring-orange-400/50'
                  : 'border-orange-500/25 bg-orange-500/10 text-orange-50 hover:bg-orange-500/20 disabled:opacity-50'
              }`}
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* KIAAN Empathetic Response */}
      {showResponse && selectedScore !== null && (
        <div className="animate-in fade-in duration-300 rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-950/50 via-indigo-900/40 to-indigo-950/50 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-xs font-bold text-slate-900">
              K
            </div>
            <p className="text-sm text-orange-50 leading-relaxed">
              {MOOD_RESPONSES[selectedScore]}
            </p>
          </div>
        </div>
      )}

      {/* Tags */}
      {!compact && selectedScore !== null && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-orange-50">Add context (optional)</h3>
          <div className="flex flex-wrap gap-2">
            {commonTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                disabled={saving}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  tags.includes(tag)
                    ? 'border-purple-400 bg-purple-500/30 text-purple-50'
                    : 'border-orange-500/25 bg-orange-500/5 text-orange-100/80 hover:bg-orange-500/10 disabled:opacity-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      {selectedScore !== null && (
        <div className="space-y-2">
          <label htmlFor="mood-note" className="text-sm font-medium text-orange-50">
            Add a note (optional)
          </label>
          <textarea
            id="mood-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind?"
            disabled={saving}
            className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/70 p-3 text-sm text-orange-50 placeholder:text-orange-100/40 outline-none focus:ring-2 focus:ring-orange-400/70 disabled:opacity-50"
            rows={compact ? 2 : 3}
          />
        </div>
      )}

      {/* Save Button */}
      {selectedScore !== null && (
        <button
          onClick={handleSaveMood}
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 font-semibold text-slate-900 transition hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Mood</span>
          )}
        </button>
      )}

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-400/30 bg-green-950/30 p-3 text-sm text-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <span>Mood saved successfully!</span>
        </div>
      )}

      {saveStatus === 'queued' && (
        <div className="flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-950/30 p-3 text-sm text-yellow-50">
          <CloudOff className="h-4 w-4" />
          <span>Mood saved offline. Will sync when connection restored.</span>
        </div>
      )}

      {saveStatus === 'error' && errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-50">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sync Button (when offline with queued items) */}
      {!isOnline && queueCount > 0 && (
        <button
          onClick={syncNow}
          disabled={syncInProgress}
          className="w-full rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-50 transition hover:bg-orange-500/20 disabled:opacity-50"
        >
          {syncInProgress ? (
            <>
              <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-2" />
              Syncing...
            </>
          ) : (
            `Sync ${queueCount} pending mood${queueCount > 1 ? 's' : ''}`
          )}
        </button>
      )}
    </div>
  )
}
