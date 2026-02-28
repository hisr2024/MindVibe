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

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { JourneyDayHeader } from '@/components/journey/JourneyDayHeader'
import { MicroPractice } from '@/components/journey/MicroPractice'
import { Day14Completed } from '@/components/journey/Day14Completed'
import { hydrateJourneyMeta } from '@/lib/journey/offlineCache'

// =============================================================================
// VERSE DISPLAY COMPONENT - Professional Sanskrit Verse Presentation
// =============================================================================

interface VerseDisplayProps {
  verse: StepResponse['verses'][0]
}

function VerseDisplay({ verse }: VerseDisplayProps) {
  const [showSanskrit, setShowSanskrit] = useState(true) // Show Sanskrit by default

  // Format verse reference beautifully
  const verseRef = `${verse.chapter}.${verse.verse}`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-amber-900/20 to-transparent">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent" />

      {/* Header */}
      <div className="relative px-6 py-4 border-b border-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30">
              <span className="text-amber-400 text-lg">ॐ</span>
            </div>
            <div>
              <h4 className="text-amber-400 font-semibold">श्रीमद्भगवद्गीता</h4>
              <p className="text-amber-400/60 text-xs">Śrīmad Bhagavad Gītā • Chapter {verse.chapter}, Verse {verse.verse}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSanskrit(!showSanskrit)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            {showSanskrit ? 'Hide Sanskrit' : 'Show Sanskrit'}
          </button>
        </div>
      </div>

      {/* Verse Number Display */}
      <div className="px-6 pt-5 pb-3 text-center">
        <p className="text-amber-500/80 font-devanagari text-xl tracking-wider">
          ॥ {verseRef} ॥
        </p>
      </div>

      {/* Sanskrit Text */}
      <AnimatePresence mode="wait">
        {showSanskrit && verse.sanskrit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-4"
          >
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-xl text-amber-200 font-devanagari leading-relaxed text-center">
                {verse.sanskrit}
              </p>
              {verse.transliteration && (
                <p className="mt-3 text-sm text-amber-400/70 italic text-center">
                  {verse.transliteration}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="mx-6 border-t border-amber-500/10" />

      {/* English Translation */}
      <div className="px-6 py-5">
        <p className="text-white/90 leading-relaxed text-base">
          {verse.english}
        </p>
      </div>

      {/* Hindi Translation */}
      {verse.hindi && (
        <>
          <div className="mx-6 border-t border-amber-500/10" />
          <div className="px-6 py-4">
            <p className="text-white/70 text-sm leading-relaxed font-devanagari">
              {verse.hindi}
            </p>
          </div>
        </>
      )}

      {/* Theme Tag */}
      {verse.theme && (
        <div className="px-6 pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400/50">Theme:</span>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs text-amber-400 font-medium">
              {verse.theme.replace(/_/g, ' ')}
            </span>
          </div>
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
    <div className="space-y-8">
      {/* Step Header - Professional Look */}
      <div className="text-center pb-6 border-b border-white/10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-amber-400">Day {step.day_index}</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{step.step_title}</h2>
      </div>

      {/* Today's Teaching - Card Style */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500" />
        <div className="p-6 pl-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400">📖</span>
            </div>
            <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Today&apos;s Teaching</h3>
          </div>
          <p className="text-white/90 leading-relaxed text-lg">{step.teaching}</p>
        </div>
      </section>

      {/* Wisdom from the Gita - Premium Verse Display */}
      {step.verses.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <span className="text-xl">🙏</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Wisdom from the Gita</h3>
              <p className="text-xs text-white/50">Sacred verse for today&apos;s practice</p>
            </div>
          </div>
          <div className="space-y-5">
            {step.verses.map((verse, idx) => (
              <VerseDisplay key={`${verse.chapter}-${verse.verse}-${idx}`} verse={verse} />
            ))}
          </div>
        </section>
      )}

      {/* Guided Reflection - Elegant Card */}
      {step.guided_reflection.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-purple-900/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-violet-500" />
          <div className="p-6 pl-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400">💭</span>
              </div>
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Guided Reflection</h3>
            </div>
            <ul className="space-y-4">
              {step.guided_reflection.map((prompt, idx) => (
                <li key={idx} className="flex gap-4 text-white/90">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs text-purple-400 font-medium">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{prompt}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Today's Practice - Action Card */}
      {step.practice && Object.keys(step.practice).length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-950/30 to-green-900/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-500" />
          <div className="p-6 pl-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400">🧘</span>
                </div>
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">Today&apos;s Practice</h3>
              </div>
              {typeof step.practice.duration_minutes === 'number' && (
                <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium">
                  {step.practice.duration_minutes} min
                </span>
              )}
            </div>
            {typeof step.practice.name === 'string' && (
              <p className="font-semibold text-white text-lg mb-4">{step.practice.name}</p>
            )}
            {Array.isArray(step.practice.instructions) && (
              <ol className="space-y-3">
                {step.practice.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex gap-4 text-white/90">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xs text-green-400 font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{String(instruction)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}

      {/* Micro Commitment - Compact Badge Style */}
      {step.micro_commitment && (
        <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 to-cyan-900/10">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500" />
          <div className="p-6 pl-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400">🎯</span>
              </div>
              <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Micro Commitment</h3>
            </div>
            <p className="text-white/90 leading-relaxed italic">&ldquo;{step.micro_commitment}&rdquo;</p>
          </div>
        </section>
      )}

      {/* Safety Note - Subtle Warning */}
      {step.safety_note && (
        <section className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-4">
          <div className="flex items-start gap-3">
            <span className="text-rose-400">⚠️</span>
            <p className="text-sm text-rose-300/90 leading-relaxed">
              {step.safety_note}
            </p>
          </div>
        </section>
      )}

      {/* Completion Section - Premium CTA */}
      {!step.is_completed && (
        <section className="space-y-4 pt-4 border-t border-white/10">
          {/* Reflection toggle */}
          <button
            onClick={() => setShowReflectionInput(!showReflectionInput)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-4 text-sm text-white/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">{showReflectionInput ? '−' : '+'}</span>
            <span>{showReflectionInput ? 'Hide Reflection' : 'Add Reflection (Optional)'}</span>
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
                  className="w-full rounded-xl border border-white/10 bg-slate-900/50 p-5 text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none resize-none text-base leading-relaxed"
                  rows={5}
                  maxLength={5000}
                />
                <p className="mt-2 text-xs text-white/40 text-right">
                  {reflection.length}/5000 characters
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete button - Premium gradient */}
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] py-5 text-lg font-bold text-black transition-all hover:bg-[position:100%_0] disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {isCompleting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Completing...
              </span>
            ) : (
              'Complete Today\'s Step'
            )}
          </button>
        </section>
      )}

      {/* Already completed - Success State */}
      {step.is_completed && (
        <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-950/50 to-green-900/20 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-green-400">✓</span>
          </div>
          <p className="text-green-400 font-semibold text-lg">Step Completed</p>
          {step.completed_at && (
            <p className="text-sm text-white/50 mt-2">
              Completed on {new Date(step.completed_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
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
  const isCompletingRef = useRef(false)
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
    hydrateJourneyMeta()
    loadJourney()
  }, [loadJourney])

  // Handle day selection
  const handleSelectDay = (day: number) => {
    setSelectedDay(day)
    loadStep(day)
  }

  // Handle step completion with pre-flight validation and auto-recovery.
  // Guards against stale state (multi-tab, cached responses, race conditions)
  // by verifying frontend state matches backend expectations before sending.
  const handleCompleteStep = async (reflection?: string) => {
    if (!step || !journey || step.is_completed || isCompletingRef.current) return

    // Set completing flag immediately to prevent double-tap race condition.
    // Must happen before any async work (including pre-flight validation).
    isCompletingRef.current = true
    setIsCompleting(true)

    // Pre-flight: verify state matches what backend expects.
    // If stale (step completed in another tab, journey advanced, etc.),
    // silently refresh instead of sending a doomed request.
    if (journey.status !== 'active') {
      isCompletingRef.current = false
      setIsCompleting(false)
      await loadJourney()
      return
    }
    if (step.day_index !== journey.current_day) {
      isCompletingRef.current = false
      setIsCompleting(false)
      await loadJourney()
      return
    }

    try {
      const result = await journeyEngineService.completeStep(
        journeyId,
        step.day_index,
        { reflection }
      )

      triggerHaptic('success')

      if (result.journey_complete) {
        router.push(`/journeys/guided/${journeyId}/complete`)
      } else {
        await loadJourney()
      }
    } catch (err) {
      if (err instanceof JourneyEngineError && err.isAuthError()) {
        router.push('/onboarding')
        return
      }

      // On 400 (step not available / day mismatch / already completed),
      // the frontend state is stale — auto-refresh to sync with backend.
      if (err instanceof JourneyEngineError && err.statusCode === 400) {
        await loadJourney()
        return
      }

      const message = err instanceof JourneyEngineError
        ? err.message
        : 'Failed to complete step. Please try again.'
      setError(message)
      triggerHaptic('error')
    } finally {
      isCompletingRef.current = false
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

        {/* Day header — Day X/14, progress bar, theme, focus */}
        <JourneyDayHeader
          currentDay={selectedDay}
          totalDays={journey.total_days}
          completedDays={journey.days_completed}
          className="mb-4"
        />

        {/* Micro-practice block with offline-persisted toggle */}
        <MicroPractice
          journeyId={journeyId}
          day={selectedDay}
          className="mb-6"
        />

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
          <Day14Completed />
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
