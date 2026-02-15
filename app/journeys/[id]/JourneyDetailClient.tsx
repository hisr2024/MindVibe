'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyService,
  JourneyServiceError,
} from '@/services/journeyService'
import type { Journey } from '@/types/journey.types'
import { getStatusLabel, getStatusColor } from '@/types/journey.types'

interface JourneyDetailClientProps {
  journeyId: string
}

export default function JourneyDetailClient({ journeyId }: JourneyDetailClientProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // State
  const [journey, setJourney] = useState<Journey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Load journey data
  const loadJourney = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await journeyService.get(journeyId)
      setJourney(data)
    } catch (err) {
      if (err instanceof JourneyServiceError) {
        if (err.isAuthError()) {
          router.push('/onboarding')
          return
        } else if (err.statusCode === 404) {
          setError('Journey not found. It may have been deleted.')
        } else if (err.statusCode === 403) {
          setError('You do not have permission to view this journey.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load journey. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [journeyId])

  useEffect(() => {
    loadJourney()
  }, [loadJourney])

  // Handle delete
  const handleDelete = async () => {
    try {
      setDeleting(true)
      await journeyService.delete(journeyId)
      triggerHaptic('success')
      router.push('/journeys')
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to delete journey.'
      setError(message)
      setShowDeleteConfirm(false)
      triggerHaptic('error')
    } finally {
      setDeleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      </main>
    )
  }

  // Error state
  if (error || !journey) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
        <FadeIn>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href="/journeys"
              className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
            >
              <span>←</span>
              <span>Back to Journeys</span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center"
          >
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {error || 'Journey not found'}
            </h2>
            <p className="text-white/60 mb-6">
              We couldn&apos;t load this journey.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={loadJourney}
                className="rounded-xl bg-white/10 px-6 py-2.5 font-medium text-white/70 hover:bg-white/20"
              >
                Try Again
              </button>
              <Link
                href="/journeys"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-medium text-black"
              >
                View All Journeys
              </Link>
            </div>
          </motion.div>
        </FadeIn>
      </main>
    )
  }

  // Format date helper
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
      <FadeIn>
        {/* Back navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            href="/journeys"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            <span>←</span>
            <span>Back to Journeys</span>
          </Link>
        </motion.div>

        {/* Journey header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Cover image */}
          {journey.cover_image_url && (
            <div className="mb-6 overflow-hidden rounded-2xl">
              <img
                src={journey.cover_image_url}
                alt={journey.title}
                className="aspect-video w-full object-cover"
                onError={(e) => {
                  // Hide broken images
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

          {/* Title and status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {journey.title}
              </h1>
              <span className={`mt-2 inline-block rounded-full border px-3 py-1 text-sm ${getStatusColor(journey.status)}`}>
                {getStatusLabel(journey.status)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Link
                href={`/journeys/${journey.id}/edit`}
                onClick={() => triggerHaptic('light')}
                className="rounded-xl bg-amber-500/20 px-4 py-2 font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  triggerHaptic('medium')
                  setShowDeleteConfirm(true)
                }}
                className="rounded-xl bg-red-500/10 px-4 py-2 font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>

        {/* Journey content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Description */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/50">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-white/80">
              {journey.description || 'No description provided.'}
            </p>
          </div>

          {/* Tags */}
          {journey.tags.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-white/50">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {journey.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/50">
              Details
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-white/40">Created</dt>
                <dd className="mt-1 text-white/80">{formatDate(journey.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-white/40">Last Updated</dt>
                <dd className="mt-1 text-white/80">{formatDate(journey.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-sm text-white/40">Journey ID</dt>
                <dd className="mt-1 font-mono text-sm text-white/60">{journey.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-white/40">Owner ID</dt>
                <dd className="mt-1 font-mono text-sm text-white/60">{journey.owner_id}</dd>
              </div>
            </dl>
          </div>
        </motion.div>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-2 text-lg font-semibold text-white">Delete Journey?</h3>
                <p className="mb-6 text-sm text-white/60">
                  Are you sure you want to delete &quot;{journey.title}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-medium text-white/70 hover:bg-white/20 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Deleting...
                      </span>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </FadeIn>
    </main>
  )
}
