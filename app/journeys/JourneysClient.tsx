'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyService,
  JourneyServiceError,
} from '@/services/journeyService'
import type {
  JourneyTemplate,
  Journey,
  JourneyAccess,
} from '@/types/journey.types'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    },
  },
}

const cardVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 20,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 25,
    },
  },
}

// Difficulty badge colors
const difficultyColors: Record<string, string> = {
  'Beginner': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Easy': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Moderate': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Challenging': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Advanced': 'bg-red-500/20 text-red-400 border-red-500/30',
}

// Inner enemy colors
const enemyColors: Record<string, string> = {
  'kama': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'krodha': 'bg-red-500/20 text-red-400 border-red-500/30',
  'lobha': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'moha': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'mada': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'matsarya': 'bg-green-500/20 text-green-400 border-green-500/30',
  'mixed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'general': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

interface JourneyCardProps {
  template: JourneyTemplate
  isActive: boolean
  activeJourney?: Journey
  canStart: boolean
  onStart: (slug: string) => void
  onContinue: (journeyId: string) => void
}

function JourneyCard({
  template,
  isActive,
  activeJourney,
  canStart,
  onStart,
  onContinue,
}: JourneyCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const primaryTag = template.primary_enemy_tags[0] || 'general'
  const tagColor = enemyColors[primaryTag] || enemyColors['general']
  const diffColor = difficultyColors[template.difficulty_label] || difficultyColors['Moderate']

  const handleClick = () => {
    triggerHaptic('medium')
    if (isActive && activeJourney) {
      onContinue(activeJourney.id)
    } else if (canStart) {
      onStart(template.slug)
    }
  }

  // Duration display
  const weeks = Math.ceil(template.duration_days / 7)
  const durationText = weeks === 1 ? '1 week' : `${weeks} weeks`

  return (
    <motion.div
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      onClick={handleClick}
      className={`
        relative cursor-pointer overflow-hidden rounded-[20px] border
        ${isActive
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-900/30 via-amber-900/20 to-orange-900/30'
          : 'border-white/10 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60'
        }
        p-5 shadow-lg transition-colors duration-200
        ${!canStart && !isActive ? 'opacity-60' : ''}
      `}
    >
      {/* Featured badge */}
      {template.is_featured && (
        <div className="absolute -right-8 top-3 rotate-45 bg-amber-500 px-8 py-0.5 text-xs font-bold text-black shadow">
          Featured
        </div>
      )}

      {/* Free badge */}
      {template.is_free && !template.is_featured && (
        <span className="absolute right-3 top-3 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400 border border-green-500/30">
          Free
        </span>
      )}

      {/* Icon */}
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${tagColor} text-2xl`}>
        {journeyService.getInnerEnemyIcon(primaryTag)}
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-semibold text-white">
        {template.title}
      </h3>

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm text-white/60">
        {template.description || 'Begin your journey of transformation.'}
      </p>

      {/* Metadata */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50">
          {durationText}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs ${diffColor}`}>
          {template.difficulty_label}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {template.primary_enemy_tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className={`rounded-full border px-2 py-0.5 text-xs ${enemyColors[tag] || enemyColors['general']}`}
          >
            {journeyService.getInnerEnemyName(tag)}
          </span>
        ))}
      </div>

      {/* Active journey progress */}
      {isActive && activeJourney && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-amber-400">In Progress</span>
            <span className="text-white/70">
              Day {activeJourney.current_day_index} of {activeJourney.total_days}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${activeJourney.progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-amber-400/70">
            Tap to continue your journey
          </p>
        </div>
      )}

      {/* Start button for non-active journeys */}
      {!isActive && canStart && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <button className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-medium text-black transition-all hover:from-amber-400 hover:to-orange-400">
            Start Journey
          </button>
        </div>
      )}

      {/* Locked state */}
      {!isActive && !canStart && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-center text-xs text-white/40">
            Complete or pause an active journey to start this one
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function JourneysClient() {
  const { triggerHaptic } = useHapticFeedback()

  // State
  const [catalog, setCatalog] = useState<JourneyTemplate[]>([])
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([])
  const [access, setAccess] = useState<JourneyAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingJourney, setStartingJourney] = useState<string | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [catalogData, activeData, accessData] = await Promise.all([
        journeyService.getCatalog(true),
        journeyService.getActiveJourneys(true).catch(() => []),
        journeyService.checkAccess().catch(() => ({
          has_access: true,
          active_count: 0,
          limit: 5,
          remaining_slots: 5,
          is_trial: false,
        })),
      ])

      setCatalog(catalogData)
      setActiveJourneys(activeData)
      setAccess(accessData)
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to load journeys. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Check if user has an active journey for a template
  const getActiveJourneyForTemplate = (templateId: string): Journey | undefined => {
    return activeJourneys.find(j => j.template?.id === templateId)
  }

  // Handle starting a journey
  const handleStartJourney = async (templateSlug: string) => {
    if (startingJourney) return

    try {
      setStartingJourney(templateSlug)
      triggerHaptic('medium')

      const newJourney = await journeyService.startJourney(templateSlug)

      // Update state
      setActiveJourneys(prev => [...prev, newJourney])
      if (access) {
        setAccess({
          ...access,
          active_count: access.active_count + 1,
          remaining_slots: access.remaining_slots - 1,
        })
      }

      triggerHaptic('success')

      // Navigate to today's step
      window.location.href = `/journeys/${newJourney.id}/today`
    } catch (err) {
      const message = err instanceof JourneyServiceError
        ? err.message
        : 'Failed to start journey. Please try again.'
      setError(message)
      triggerHaptic('error')
    } finally {
      setStartingJourney(null)
    }
  }

  // Handle continuing a journey
  const handleContinueJourney = (journeyId: string) => {
    triggerHaptic('light')
    window.location.href = `/journeys/${journeyId}/today`
  }

  // Can start new journey?
  const canStartNew = access?.remaining_slots ? access.remaining_slots > 0 : true

  // Separate featured and regular journeys
  const featuredJourneys = catalog.filter(t => t.is_featured)
  const regularJourneys = catalog.filter(t => !t.is_featured)

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-4 lg:px-6">
      <FadeIn>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-200 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Wisdom Journeys
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/60">
            Transform your inner world by overcoming the six inner enemies (Sad-Ripu).
            Select one or more journeys to begin your path to inner peace.
          </p>
        </motion.div>

        {/* Trial Access Banner */}
        {access?.is_trial && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-amber-400">
              <span className="text-xl">✨</span>
              <span className="font-medium">Free Trial Access</span>
            </div>
            <p className="mt-1 text-sm text-white/60">
              Try 1 journey for 3 days free! Experience the transformation.
            </p>
            <button className="mt-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-medium text-black">
              Upgrade for Full Access
            </button>
          </motion.div>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-center text-red-400"
          >
            {error}
            <button
              onClick={() => {
                setError(null)
                loadData()
              }}
              className="ml-2 underline hover:text-red-300"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Active Journeys Section */}
            {activeJourneys.length > 0 && (
              <section>
                <motion.h2
                  variants={itemVariants}
                  className="mb-4 text-lg font-semibold text-amber-400"
                >
                  Your Active Journeys ({activeJourneys.length})
                </motion.h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeJourneys.map((journey) => (
                    journey.template && (
                      <motion.div key={journey.id} variants={itemVariants}>
                        <JourneyCard
                          template={journey.template}
                          isActive={true}
                          activeJourney={journey}
                          canStart={false}
                          onStart={handleStartJourney}
                          onContinue={handleContinueJourney}
                        />
                      </motion.div>
                    )
                  ))}
                </div>
              </section>
            )}

            {/* Featured Journeys Section */}
            {featuredJourneys.length > 0 && (
              <section>
                <motion.h2
                  variants={itemVariants}
                  className="mb-4 text-lg font-semibold text-white"
                >
                  Featured Journeys
                </motion.h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredJourneys.map((template) => {
                    const activeJourney = getActiveJourneyForTemplate(template.id)
                    return (
                      <motion.div key={template.id} variants={itemVariants}>
                        <JourneyCard
                          template={template}
                          isActive={!!activeJourney}
                          activeJourney={activeJourney}
                          canStart={canStartNew && !activeJourney}
                          onStart={handleStartJourney}
                          onContinue={handleContinueJourney}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* All Journeys Section */}
            {regularJourneys.length > 0 && (
              <section>
                <motion.h2
                  variants={itemVariants}
                  className="mb-4 text-lg font-semibold text-white"
                >
                  All Journeys
                </motion.h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {regularJourneys.map((template) => {
                    const activeJourney = getActiveJourneyForTemplate(template.id)
                    return (
                      <motion.div key={template.id} variants={itemVariants}>
                        <JourneyCard
                          template={template}
                          isActive={!!activeJourney}
                          activeJourney={activeJourney}
                          canStart={canStartNew && !activeJourney}
                          onStart={handleStartJourney}
                          onContinue={handleContinueJourney}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Empty state */}
            {catalog.length === 0 && !error && (
              <motion.div
                variants={itemVariants}
                className="py-20 text-center"
              >
                <div className="text-4xl">🧘</div>
                <h3 className="mt-4 text-lg font-medium text-white">No Journeys Available</h3>
                <p className="mt-2 text-white/60">
                  Check back soon for new wisdom journeys.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </FadeIn>
    </main>
  )
}
