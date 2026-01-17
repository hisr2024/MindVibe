'use client'

import { useState, useEffect } from 'react'
import { X, Star, Clock } from 'lucide-react'

interface ProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    time_spent_seconds?: number
    user_notes?: string
    user_rating?: number
  }) => Promise<void>
  stepNumber: number
}

/**
 * ProgressModal component for marking journey steps as complete.
 *
 * Features:
 * - Time spent tracking (auto-timer)
 * - User notes textarea (optional)
 * - 5-star rating system (optional)
 * - Loading state during submission
 * - Validation and error handling
 * - Elegant modal overlay with backdrop blur
 */
export function ProgressModal({
  isOpen,
  onClose,
  onSubmit,
  stepNumber,
}: ProgressModalProps) {
  const [timeSpent, setTimeSpent] = useState(0)
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-timer
  useEffect(() => {
    if (!isOpen) {
      setTimeSpent(0)
      return
    }

    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNotes('')
      setRating(null)
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        time_spent_seconds: timeSpent,
        user_notes: notes.trim() || undefined,
        user_rating: rating || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete step')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-orange-50">
                Complete Step {stepNumber}
              </h2>
              <p className="mt-1 text-sm text-orange-100/70">
                Share your reflections and mark your progress
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-orange-100/60 transition-colors hover:bg-white/5 hover:text-orange-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Time Spent */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-50">Time Spent</p>
                  <p className="text-xs text-orange-100/60">Automatically tracked</p>
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums text-blue-300">
                {formatTime(timeSpent)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-orange-50">
              Your Reflections <span className="text-orange-100/60">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What insights did you gain from this verse? How does it apply to your life?"
              className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-orange-50 placeholder-orange-100/40 transition-colors focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-orange-100/50">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Rating */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-orange-50">
              Rate This Step <span className="text-orange-100/60">(Optional)</span>
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="group transition-transform duration-100 hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      (hoveredStar !== null ? star <= hoveredStar : star <= (rating || 0))
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-transparent text-orange-100/30 group-hover:text-orange-100/60'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating && (
              <p className="mt-2 text-center text-xs text-amber-400">
                You rated this step {rating} star{rating !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-orange-100 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="group relative flex-1 overflow-hidden rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">
                {isSubmitting ? 'Completing...' : 'Complete Step'}
              </span>
              {!isSubmitting && (
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
