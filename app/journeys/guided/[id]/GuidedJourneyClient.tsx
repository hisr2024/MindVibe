'use client'

/**
 * Guided Journey Detail Page - View and complete daily steps.
 *
 * Features:
 * - Journey progress overview
 * - Current step content (teaching, verses, reflection, practice)
 * - Step completion with optional reflection
 * - Navigation between completed steps
 * - Journey actions (pause, resume, abandon)
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import type {
  JourneyResponse,
  StepResponse,
  EnemyType,
} from '@/types/journeyEngine.types'
import {
  ENEMY_INFO,
  getJourneyStatusLabel,
  getJourneyStatusColor,
} from '@/types/journeyEngine.types'

// =============================================================================
// VERSE DISPLAY COMPONENT
// =============================================================================

interface VerseDisplayProps {
  verse: StepResponse['verses'][0]
}

function VerseDisplay({ verse }: VerseDisplayProps) {
  const [showSanskrit, setShowSanskrit] = useState(false)

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-amber-400">
          Bhagavad Gita {verse.chapter}.{verse.verse}
        </span>
        {verse.sanskrit && (
          <button
            onClick={() => setShowSanskrit(!showSanskrit)}
            className="text-xs text-amber-400/70 hover:text-amber-400"
          >
            {showSanskrit ? 'Hide Sanskrit' : 'Show Sanskrit'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showSanskrit && verse.sanskrit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <p className="text-lg text-amber-200 font-serif italic leading-relaxed">
              {verse.sanskrit}
            </p>
            {verse.transliteration && (
              <p className="mt-2 text-sm text-amber-400/70 italic">
                {verse.transliteration}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-white leading-relaxed">
        {verse.english}
      </p>

      {verse.hindi && (
        <p className="mt-3 text-white/70 text-sm">
          {verse.hindi}
        </p>
      )}

      {verse.theme && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-amber-400/50">Theme:</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
            {verse.theme}
          </span>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// STEP CONTENT COMPONENT
// =============================================================================

interface StepContentProps {
  step: StepResponse
  onComplete: (reflection?: string) => void
  isCompleting: boolean
}

function StepContent({ step, onComplete, isCompleting }: StepContentProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [reflection, setReflection] = useState('')
  const [showReflectionInput, setShowReflectionInput] = useState(false)

  const handleComplete = () => {
    triggerHaptic('medium')
    if (showReflectionInput && reflection.trim()) {
      onComplete(reflection.trim())
    } else {
      onComplete()
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">{step.step_title}</h2>
        <span className="text-sm text-white/50">Day {step.day_index}</span>
      </div>

      {/* Teaching */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-amber-400 mb-3">Today&apos;s Teaching</h3>
        <p className="text-white/90 leading-relaxed">{step.teaching}</p>
      </section>

      {/* Verses */}
      {step.verses.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-amber-400 mb-3">Wisdom from the Gita</h3>
          <div className="space-y-4">
            {step.verses.map((verse, idx) => (
              <VerseDisplay key={`${verse.chapter}-${verse.verse}-${idx}`} verse={verse} />
            ))}
          </div>
        </section>
      )}

      {/* Guided Reflection */}
      {step.guided_reflection.length > 0 && (
        <section className="rounded-xl border border-purple-500/30 bg-purple-900/10 p-5">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">Guided Reflection</h3>
          <ul className="space-y-3">
            {step.guided_reflection.map((prompt, idx) => (
              <li key={idx} className="flex gap-3 text-white/90">
                <span className="text-purple-400">•</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Practice */}
      {step.practice && Object.keys(step.practice).length > 0 && (
        <section className="rounded-xl border border-green-500/30 bg-green-900/10 p-5">
          <h3 className="text-sm font-semibold text-green-400 mb-3">Today&apos;s Practice</h3>
          {typeof step.practice.name === 'string' && (
            <p className="font-medium text-white mb-2">{step.practice.name}</p>
          )}
          {Array.isArray(step.practice.instructions) && (
            <ol className="space-y-2">
              {step.practice.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-3 text-white/90">
                  <span className="text-green-400 font-medium">{idx + 1}.</span>
                  <span>{String(instruction)}</span>
                </li>
              ))}
            </ol>
          )}
          {typeof step.practice.duration_minutes === 'number' && (
            <p className="mt-3 text-sm text-green-400/70">
              Duration: {step.practice.duration_minutes} minutes
            </p>
          )}
        </section>
      )}

      {/* Micro Commitment */}
      {step.micro_commitment && (
        <section className="rounded-xl border border-cyan-500/30 bg-cyan-900/10 p-5">
          <h3 className="text-sm font-semibold text-cyan-400 mb-2">Micro Commitment</h3>
          <p className="text-white/90">{step.micro_commitment}</p>
        </section>
      )}

      {/* Safety Note */}
      {step.safety_note && (
        <section className="rounded-xl border border-rose-500/30 bg-rose-900/10 p-4">
          <p className="text-sm text-rose-300">
            <span className="font-medium">Note:</span> {step.safety_note}
          </p>
        </section>
      )}

      {/* Completion Section */}
      {!step.is_completed && (
        <section className="space-y-4">
          {/* Reflection toggle */}
          <button
            onClick={() => setShowReflectionInput(!showReflectionInput)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-3 text-sm text-white/70 hover:bg-white/10"
          >
            {showReflectionInput ? '− Hide Reflection' : '+ Add Reflection (Optional)'}
          </button>

          {/* Reflection input */}
          <AnimatePresence>
            {showReflectionInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Write your reflection here... What insights arose? How did the practice feel?"
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none resize-none"
                  rows={4}
                  maxLength={5000}
                />
                <p className="mt-1 text-xs text-white/40 text-right">
                  {reflection.length}/5000
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete button */}
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-semibold text-black transition-all hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
          >
            {isCompleting ? 'Completing...' : 'Complete Today\'s Step'}
          </button>
        </section>
      )}

      {/* Already completed message */}
      {step.is_completed && (
        <div className="rounded-xl border border-green-500/30 bg-green-900/20 p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-400 font-medium">Step Completed</p>
          {step.completed_at && (
            <p className="text-sm text-white/50 mt-1">
              Completed {new Date(step.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// DAY SELECTOR COMPONENT
// =============================================================================

interface DaySelectorProps {
  totalDays: number
  currentDay: number
  completedDays: number
  selectedDay: number
  onSelectDay: (day: number) => void
}

function DaySelector({ totalDays, currentDay, completedDays, selectedDay, onSelectDay }: DaySelectorProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
      {[...Array(totalDays)].map((_, idx) => {
        const day = idx + 1
        const isCompleted = day <= completedDays
        const isCurrent = day === currentDay
        const isAccessible = day <= currentDay
        const isSelected = day === selectedDay

        return (
          <button
            key={day}
            onClick={() => {
              if (isAccessible) {
                triggerHaptic('light')
                onSelectDay(day)
              }
            }}
            disabled={!isAccessible}
            className={`flex-shrink-0 w-10 h-10 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? 'bg-amber-500 text-black'
                : isCompleted
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isCurrent
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : isAccessible
                ? 'bg-white/10 text-white/70 hover:bg-white/20'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface Props {
  journeyId: string
}

export default function GuidedJourneyClient({ journeyId }: Props) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [journey, setJourney] = useState<JourneyResponse | null>(null)
  const [step, setStep] = useState<StepResponse | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Get enemy info
  const primaryEnemy = journey?.primary_enemies[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  // Load journey and current step
  const loadJourney = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const journeyData = await journeyEngineService.getJourney(journeyId)
      setJourney(journeyData)
      setSelectedDay(journeyData.current_day)

      // Load current step
      if (journeyData.status === 'active') {
        const stepData = await journeyEngineService.getCurrentStep(journeyId)
        setStep(stepData)
      }
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isNotFoundError()) {
          setError('Journey not found.')
        } else if (err.isAuthError()) {
          router.push('/onboarding')
          return
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load journey. Please try again.')
      }
      console.error('[GuidedJourneyClient] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [journeyId, router])

  // Load specific day's step
  const loadStep = useCallback(async (day: number) => {
    if (!journey) return

    try {
      const stepData = await journeyEngineService.getStep(journeyId, day)
      setStep(stepData)
    } catch (err) {
      console.error('[GuidedJourneyClient] Error loading step:', err)
      setError('Failed to load step. Please try again.')
    }
  }, [journeyId, journey])

  useEffect(() => {
    loadJourney()
  }, [loadJourney])

  // Handle day selection
  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
    loadStep(day)
  }

  // Handle step completion
  const handleCompleteStep = async (reflection?: string) => {
    if (!step || isCompleting) return

    try {
      setIsCompleting(true)
      const result = await journeyEngineService.completeStep(
        journeyId,
        step.day_index,
        { reflection }
      )

      triggerHaptic('success')

      if (result.journey_complete) {
        // Show completion celebration
        router.push(`/journeys/guided/${journeyId}/complete`)
      } else {
        // Reload to show updated state
        await loadJourney()
      }
    } catch (err) {
      const message = err instanceof JourneyEngineError
        ? err.message
        : 'Failed to complete step. Please try again.'
      setError(message)
      triggerHaptic('error')
    } finally {
      setIsCompleting(false)
    }
  }

  // Handle journey actions
  const handleAction = async (action: 'pause' | 'resume' | 'abandon') => {
    if (actionLoading) return

    try {
      setActionLoading(action)

      if (action === 'pause') {
        await journeyEngineService.pauseJourney(journeyId)
      } else if (action === 'resume') {
        await journeyEngineService.resumeJourney(journeyId)
      } else if (action === 'abandon') {
        await journeyEngineService.abandonJourney(journeyId)
        router.push('/journeys')
        return
      }

      triggerHaptic('success')
      await loadJourney()
      setShowActions(false)
    } catch (err) {
      const message = err instanceof JourneyEngineError
        ? err.message
        : `Failed to ${action} journey.`
      setError(message)
      triggerHaptic('error')
    } finally {
      setActionLoading(null)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
        <FadeIn>
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        </FadeIn>
      </main>
    )
  }

  // Render error state
  if (error && !journey) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
        <FadeIn>
          <div className="rounded-xl border border-red-500/30 bg-red-900/20 p-8 text-center">
            <div className="text-4xl mb-4">😔</div>
            <h2 className="text-lg font-medium text-white mb-2">Error</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <Link
              href="/journeys"
              className="inline-block rounded-xl bg-white/10 px-6 py-2.5 font-medium text-white hover:bg-white/20"
            >
              Back to Journeys
            </Link>
          </div>
        </FadeIn>
      </main>
    )
  }

  if (!journey) return null

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-4 lg:px-6">
      <FadeIn>
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/journeys"
            className="text-sm text-white/50 hover:text-white/70 mb-2 inline-block"
          >
            ← Back to Journeys
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Enemy indicator */}
              {enemyInfo && (
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: enemyInfo.color }}
                  />
                  <span className="text-xs" style={{ color: enemyInfo.color }}>
                    {enemyInfo.sanskrit} ({enemyInfo.name})
                  </span>
                </div>
              )}

              <h1 className="text-xl font-bold text-white">{journey.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-xs ${getJourneyStatusColor(journey.status)}`}>
                {getJourneyStatusLabel(journey.status)}
              </span>
              <button
                onClick={() => setShowActions(!showActions)}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
              >
                <span className="text-white/70">⋯</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions dropdown */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl border border-white/10 bg-slate-900 p-4 space-y-2"
            >
              {journey.status === 'active' && (
                <button
                  onClick={() => handleAction('pause')}
                  disabled={actionLoading !== null}
                  className="w-full rounded-lg bg-amber-500/20 py-2 text-sm text-amber-400 hover:bg-amber-500/30 disabled:opacity-50"
                >
                  {actionLoading === 'pause' ? 'Pausing...' : 'Pause Journey'}
                </button>
              )}
              {journey.status === 'paused' && (
                <button
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading !== null}
                  className="w-full rounded-lg bg-green-500/20 py-2 text-sm text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                >
                  {actionLoading === 'resume' ? 'Resuming...' : 'Resume Journey'}
                </button>
              )}
              {(journey.status === 'active' || journey.status === 'paused') && (
                <button
                  onClick={() => handleAction('abandon')}
                  disabled={actionLoading !== null}
                  className="w-full rounded-lg bg-red-500/20 py-2 text-sm text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                >
                  {actionLoading === 'abandon' ? 'Abandoning...' : 'Abandon Journey'}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/50">
              Day {journey.current_day} of {journey.total_days}
            </span>
            <span className="text-sm font-medium text-amber-400">
              {Math.round(journey.progress_percentage)}% complete
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: enemyInfo?.color || '#F59E0B' }}
              initial={{ width: 0 }}
              animate={{ width: `${journey.progress_percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {journey.streak_days > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm text-amber-400">
              <span>🔥</span>
              <span>{journey.streak_days} day streak</span>
            </div>
          )}
        </div>

        {/* Day selector */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white/50 mb-2">Jump to Day</h3>
          <DaySelector
            totalDays={journey.total_days}
            currentDay={journey.current_day}
            completedDays={journey.days_completed}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl border border-red-500/30 bg-red-900/20 p-4 text-center text-red-400"
            >
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm underline hover:text-red-300"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        {step ? (
          <StepContent
            step={step}
            onComplete={handleCompleteStep}
            isCompleting={isCompleting}
          />
        ) : journey.status === 'paused' ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-8 text-center">
            <div className="text-4xl mb-4">⏸️</div>
            <h2 className="text-lg font-medium text-white mb-2">Journey Paused</h2>
            <p className="text-white/60 mb-6">
              Resume your journey to continue your transformation.
            </p>
            <button
              onClick={() => handleAction('resume')}
              disabled={actionLoading !== null}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-medium text-black hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
            >
              {actionLoading === 'resume' ? 'Resuming...' : 'Resume Journey'}
            </button>
          </div>
        ) : journey.status === 'completed' ? (
          <div className="rounded-xl border border-green-500/30 bg-green-900/10 p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-lg font-medium text-white mb-2">Journey Complete!</h2>
            <p className="text-white/60 mb-6">
              Congratulations on completing this journey of transformation.
            </p>
            <Link
              href="/journeys"
              className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 font-medium text-black hover:from-amber-400 hover:to-orange-400"
            >
              Start Another Journey
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto" />
            <p className="mt-4 text-white/60">Loading step content...</p>
          </div>
        )}
      </FadeIn>
    </main>
  )
}
