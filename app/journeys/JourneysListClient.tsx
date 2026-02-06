'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyService,
  JourneyServiceError,
} from '@/services/journeyService'
import type {
  Journey,
  JourneyStatus,
  JourneySortField,
  SortOrder,
} from '@/types/journey.types'
import { getStatusLabel, getStatusColor } from '@/types/journey.types'

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
}

const cardVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    y: -2,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  tap: { scale: 0.98 },
}

// Status filter options
const STATUS_OPTIONS: { value: JourneyStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

interface JourneyCardProps {
  journey: Journey
  onDelete: (id: string) => void
}

function JourneyCard({ journey, onDelete }: JourneyCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    triggerHaptic('medium')
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    triggerHaptic('heavy')
    onDelete(journey.id)
    setShowDeleteConfirm(false)
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className="relative rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
    >
      {/* Status badge */}
      <span className={`absolute right-4 top-4 rounded-full border px-2 py-0.5 text-xs ${getStatusColor(journey.status)}`}>
        {getStatusLabel(journey.status)}
      </span>

      {/* Title */}
      <h3 className="mb-2 pr-20 text-lg font-semibold text-white line-clamp-1">
        {journey.title}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm text-white/60 line-clamp-2">
        {journey.description || 'No description'}
      </p>

      {/* Tags */}
      {journey.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {journey.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50"
            >
              {tag}
            </span>
          ))}
          {journey.tags.length > 3 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
              +{journey.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mb-4 text-xs text-white/40">
        Updated {journey.updated_at ? new Date(journey.updated_at).toLocaleDateString() : 'Never'}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/journeys/${journey.id}`}
          className="flex-1 rounded-lg bg-amber-500/20 py-2 text-center text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/30"
          onClick={() => triggerHaptic('light')}
        >
          View
        </Link>
        <Link
          href={`/journeys/${journey.id}/edit`}
          className="flex-1 rounded-lg bg-white/10 py-2 text-center text-sm font-medium text-white/70 transition-colors hover:bg-white/20"
          onClick={() => triggerHaptic('light')}
        >
          Edit
        </Link>
        <button
          onClick={handleDelete}
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
          aria-label="Delete journey"
        >
          Delete
        </button>
      </div>

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
                  className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-medium text-white/70 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function JourneysListClient() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // State
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)
  const [statusFilter, setStatusFilter] = useState<JourneyStatus | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<JourneySortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Load journeys
  const loadJourneys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setIsAuthError(false)

      const result = await journeyService.list({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: 50,
      })

      setJourneys(result.items)
      setTotal(result.total)
    } catch (err) {
      if (err instanceof JourneyServiceError) {
        // Handle authentication errors specifically
        if (err.isAuthError()) {
          setIsAuthError(true)
          setError('Please sign in to view your journeys.')
        } else if (err.isForbiddenError()) {
          setError('You do not have permission to access these journeys.')
        } else if (err.isServerError()) {
          setError('Our servers are experiencing issues. Please try again in a moment.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load journeys. Please try again.')
      }
      // Don't log auth errors to console - they're expected for unauthenticated users
      if (!(err instanceof JourneyServiceError && err.isAuthError())) {
        console.warn('[JourneysListClient] Error loading journeys:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, sortBy, sortOrder])

  useEffect(() => {
    loadJourneys()
  }, [loadJourneys])

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await journeyService.delete(id)
      setJourneys((prev) => prev.filter((j) => j.id !== id))
      setTotal((prev) => prev - 1)
      triggerHaptic('success')
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to delete journey.'
      setError(message)
      triggerHaptic('error')
    }
  }

  // Handle create
  const handleCreate = () => {
    triggerHaptic('medium')
    router.push('/journeys/new')
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-4 lg:px-6">
      <FadeIn>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">My Journeys</h1>
            <p className="mt-1 text-white/60">Track your goals and progress</p>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-medium text-black transition-all hover:from-amber-400 hover:to-orange-400"
          >
            + New Journey
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search journeys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 pl-10 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JourneyStatus | '')}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900">
                {opt.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split(':') as [JourneySortField, SortOrder]
              setSortBy(field)
              setSortOrder(order)
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-amber-500/50 focus:outline-none"
          >
            <option value="updated_at:desc" className="bg-slate-900">Recently Updated</option>
            <option value="created_at:desc" className="bg-slate-900">Newest First</option>
            <option value="created_at:asc" className="bg-slate-900">Oldest First</option>
            <option value="title:asc" className="bg-slate-900">Title A-Z</option>
            <option value="title:desc" className="bg-slate-900">Title Z-A</option>
          </select>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 text-center ${
              isAuthError
                ? 'border-amber-500/30 bg-amber-900/20 text-amber-400'
                : 'border-red-500/30 bg-red-900/20 text-red-400'
            }`}
          >
            <p className="mb-3">{error}</p>
            {isAuthError ? (
              <Link
                href="/onboarding"
                className="inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={() => {
                  setError(null)
                  loadJourneys()
                }}
                className="underline hover:text-red-300"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}

        {/* Journey list */}
        {!loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {journeys.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-white/40">
                  {total} {total === 1 ? 'journey' : 'journeys'} found
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {journeys.map((journey) => (
                      <motion.div key={journey.id} variants={itemVariants} layout>
                        <JourneyCard journey={journey} onDelete={handleDelete} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div
                variants={itemVariants}
                className="py-20 text-center"
              >
                <div className="text-5xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-white mb-2">No journeys yet</h3>
                <p className="text-white/60 mb-6">
                  {searchQuery || statusFilter
                    ? 'No journeys match your filters.'
                    : 'Start tracking your goals by creating your first journey.'}
                </p>
                {!searchQuery && !statusFilter && (
                  <button
                    onClick={handleCreate}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-medium text-black"
                  >
                    Create Your First Journey
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </FadeIn>
    </main>
  )
}
