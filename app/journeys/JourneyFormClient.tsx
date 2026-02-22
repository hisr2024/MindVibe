'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyService,
  JourneyServiceError,
} from '@/services/journeyService'
import type {
  JourneyStatus,
  JourneyFormState,
} from '@/types/journey.types'
import { INITIAL_JOURNEY_FORM, getStatusLabel } from '@/types/journey.types'

interface JourneyFormClientProps {
  mode: 'create' | 'edit'
  journeyId?: string
}

const STATUS_OPTIONS: JourneyStatus[] = ['draft', 'active', 'completed', 'archived']

export default function JourneyFormClient({ mode, journeyId }: JourneyFormClientProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // Form state
  const [form, setForm] = useState<JourneyFormState>(INITIAL_JOURNEY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Load journey data for edit mode
  useEffect(() => {
    if (mode === 'edit' && journeyId) {
      loadJourney()
    }
  }, [mode, journeyId])

  const loadJourney = async () => {
    if (!journeyId) return

    try {
      setLoading(true)
      setError(null)

      const journey = await journeyService.get(journeyId)
      setForm({
        title: journey.title,
        description: journey.description || '',
        status: journey.status,
        cover_image_url: journey.cover_image_url || '',
        tags: journey.tags,
      })
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to load journey.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Form validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!form.title.trim()) {
      errors.title = 'Title is required'
    } else if (form.title.length > 255) {
      errors.title = 'Title must be 255 characters or less'
    }

    if (form.description && form.description.length > 5000) {
      errors.description = 'Description must be 5000 characters or less'
    }

    if (form.cover_image_url && form.cover_image_url.length > 512) {
      errors.cover_image_url = 'URL must be 512 characters or less'
    }

    if (form.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      triggerHaptic('error')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      triggerHaptic('medium')

      const data = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        cover_image_url: form.cover_image_url.trim() || null,
        tags: form.tags,
      }

      if (mode === 'create') {
        const journey = await journeyService.create(data)
        triggerHaptic('success')
        router.push(`/journeys/${journey.id}`)
      } else if (journeyId) {
        await journeyService.update(journeyId, data)
        triggerHaptic('success')
        router.push(`/journeys/${journeyId}`)
      }
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to save journey.'
      setError(message)
      triggerHaptic('error')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle tag input
  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag) && form.tags.length < 10) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag.slice(0, 50)] }))
      setTagInput('')
      triggerHaptic('light')
    }
  }

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
    triggerHaptic('light')
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  // Field update helper
  const updateField = <K extends keyof JourneyFormState>(
    field: K,
    value: JourneyFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-4 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-20 pt-4 lg:px-6">
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {mode === 'create' ? 'Create New Journey' : 'Edit Journey'}
          </h1>
          <p className="mt-2 text-white/60">
            {mode === 'create'
              ? 'Set up a new journey to track your goals and progress.'
              : 'Update your journey details.'}
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-white">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter journey title"
              maxLength={255}
              className={`w-full rounded-xl border px-4 py-3 text-white placeholder-white/40 focus:outline-none ${
                fieldErrors.title
                  ? 'border-red-500 bg-red-900/10 focus:border-red-500'
                  : 'border-white/10 bg-white/5 focus:border-amber-500/50'
              }`}
              aria-invalid={!!fieldErrors.title}
              aria-describedby={fieldErrors.title ? 'title-error' : undefined}
            />
            {fieldErrors.title && (
              <p id="title-error" className="mt-1 text-sm text-red-400">
                {fieldErrors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your journey (optional)"
              rows={4}
              maxLength={5000}
              className={`w-full resize-none rounded-xl border px-4 py-3 text-white placeholder-white/40 focus:outline-none ${
                fieldErrors.description
                  ? 'border-red-500 bg-red-900/10 focus:border-red-500'
                  : 'border-white/10 bg-white/5 focus:border-amber-500/50'
              }`}
              aria-invalid={!!fieldErrors.description}
              aria-describedby={fieldErrors.description ? 'description-error' : undefined}
            />
            {fieldErrors.description && (
              <p id="description-error" className="mt-1 text-sm text-red-400">{fieldErrors.description}</p>
            )}
            <p className="mt-1 text-right text-xs text-white/40">
              {form.description.length}/5000
            </p>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-white">
              Status
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => updateField('status', e.target.value as JourneyStatus)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-500/50 focus:outline-none"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status} className="bg-slate-900">
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>

          {/* Cover Image URL */}
          <div>
            <label htmlFor="cover_image_url" className="mb-2 block text-sm font-medium text-white">
              Cover Image URL
            </label>
            <input
              id="cover_image_url"
              type="url"
              value={form.cover_image_url}
              onChange={(e) => updateField('cover_image_url', e.target.value)}
              placeholder="https://example.com/image.jpg (optional)"
              maxLength={512}
              className={`w-full rounded-xl border px-4 py-3 text-white placeholder-white/40 focus:outline-none ${
                fieldErrors.cover_image_url
                  ? 'border-red-500 bg-red-900/10 focus:border-red-500'
                  : 'border-white/10 bg-white/5 focus:border-amber-500/50'
              }`}
              aria-invalid={!!fieldErrors.cover_image_url}
              aria-describedby={fieldErrors.cover_image_url ? 'cover-image-error' : undefined}
            />
            {fieldErrors.cover_image_url && (
              <p id="cover-image-error" className="mt-1 text-sm text-red-400">{fieldErrors.cover_image_url}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="mb-2 block text-sm font-medium text-white">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag and press Enter"
                maxLength={50}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none"
                aria-invalid={!!fieldErrors.tags}
                aria-describedby={fieldErrors.tags ? 'tags-error' : undefined}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || form.tags.length >= 10}
                className="rounded-xl bg-white/10 px-4 py-3 text-white/70 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-400"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-amber-400/70 hover:text-amber-400"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {fieldErrors.tags && (
              <p id="tags-error" className="mt-1 text-sm text-red-400">{fieldErrors.tags}</p>
            )}
            <p className="mt-2 text-xs text-white/40">
              {form.tags.length}/10 tags
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/journeys"
              className="flex-1 rounded-xl bg-white/10 py-3 text-center font-medium text-white/70 transition-colors hover:bg-white/20"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-medium text-black transition-all hover:from-amber-400 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Saving...
                </span>
              ) : mode === 'create' ? (
                'Create Journey'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </motion.form>
      </FadeIn>
    </main>
  )
}
