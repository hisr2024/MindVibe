'use client'

/**
 * Mobile Journey Detail & Guided Experience Page
 *
 * Full mobile-optimized journey view with:
 * - Journey progress header with day selector
 * - Step content (teaching, verses, reflection, practice)
 * - Step completion with optional reflection
 * - Journey actions (pause, resume, abandon)
 * - Swipe-friendly day navigation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  MoreVertical,
  Pause,
  Play,
  X,
  BookOpen,
  Sparkles,
  Target,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
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
} from '@/types/journeyEngine.types'

export default function MobileJourneyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const journeyId = params.id as string
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [journey, setJourney] = useState<JourneyResponse | null>(null)
  const [step, setStep] = useState<StepResponse | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [isCompleting, setIsCompleting] = useState(false)
  const isCompletingRef = useRef(false)
  const [showActions, setShowActions] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [reflection, setReflection] = useState('')
  const [showReflection, setShowReflection] = useState(false)

  const primaryEnemy = journey?.primary_enemies[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  const loadJourney = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const journeyData = await journeyEngineService.getJourney(journeyId)
      setJourney(journeyData)
      setSelectedDay(journeyData.current_day)

      if (journeyData.status === 'active') {
        const stepData = await journeyEngineService.getCurrentStep(journeyId)
        setStep(stepData)
      }
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isAuthError()) {
          router.push('/onboarding')
          return
        }
        setError(err.isNotFoundError() ? 'Journey not found.' : err.message)
      } else {
        setError('Failed to load journey. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [journeyId, router])

  const loadStep = useCallback(async (day: number) => {
    if (!journey) return
    try {
      const stepData = await journeyEngineService.getStep(journeyId, day)
      setStep(stepData)
    } catch {
      setError('Failed to load step.')
    }
  }, [journeyId, journey])

  useEffect(() => {
    if (isAuthenticated) loadJourney()
  }, [isAuthenticated, loadJourney])

  const handleSelectDay = (day: number) => {
    triggerHaptic('selection')
    setSelectedDay(day)
    loadStep(day)
  }

  const handleCompleteStep = async () => {
    if (!step || !journey || step.is_completed || isCompletingRef.current) return
    if (journey.status !== 'active' || step.day_index !== journey.current_day) {
      await loadJourney()
      return
    }

    isCompletingRef.current = true
    setIsCompleting(true)

    try {
      const result = await journeyEngineService.completeStep(
        journeyId,
        step.day_index,
        { reflection: showReflection && reflection.trim() ? reflection.trim() : undefined }
      )

      triggerHaptic('success')

      if (result.journey_complete) {
        router.push('/m/journeys')
      } else {
        setReflection('')
        setShowReflection(false)
        await loadJourney()
      }
    } catch (err) {
      if (err instanceof JourneyEngineError && err.isAuthError()) {
        router.push('/onboarding')
        return
      }
      if (err instanceof JourneyEngineError && err.statusCode === 400) {
        await loadJourney()
        return
      }
      setError(err instanceof JourneyEngineError ? err.message : 'Failed to complete step.')
      triggerHaptic('error')
    } finally {
      isCompletingRef.current = false
      setIsCompleting(false)
    }
  }

  const handleAction = async (action: 'pause' | 'resume' | 'abandon') => {
    if (actionLoading) return
    try {
      setActionLoading(action)
      if (action === 'pause') await journeyEngineService.pauseJourney(journeyId)
      else if (action === 'resume') await journeyEngineService.resumeJourney(journeyId)
      else if (action === 'abandon') {
        await journeyEngineService.abandonJourney(journeyId)
        router.push('/m/journeys')
        return
      }
      triggerHaptic('success')
      await loadJourney()
      setShowActions(false)
    } catch (err) {
      setError(err instanceof JourneyEngineError ? err.message : `Failed to ${action} journey.`)
      triggerHaptic('error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <MobileAppShell title="Journey" showBack showTabBar={false}>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4a44c] border-t-transparent" />
        </div>
      </MobileAppShell>
    )
  }

  if (error && !journey) {
    return (
      <MobileAppShell title="Journey" showBack showTabBar={false}>
        <div className="px-4 py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-[#d4a44c] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-white/60 mb-6">{error}</p>
          <button
            onClick={loadJourney}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </MobileAppShell>
    )
  }

  if (!journey) return null

  const progressPercent = journey.total_days > 0
    ? Math.round((journey.days_completed / journey.total_days) * 100)
    : 0

  return (
    <MobileAppShell
      title=""
      showHeader={false}
      showTabBar={false}
    >
      {/* Custom header */}
      <div className="sticky top-0 z-20 bg-[#050507]/95 backdrop-blur-xl border-b border-white/[0.06]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/m/journeys')}
            className="p-2 -ml-2 rounded-full"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex-1 text-center px-4">
            {enemyInfo && (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: enemyInfo.color }} />
                <span className="text-xs font-medium" style={{ color: enemyInfo.color }}>
                  {enemyInfo.sanskrit}
                </span>
              </div>
            )}
            <h1 className="text-sm font-semibold text-white truncate">{journey.title}</h1>
          </div>

          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 -mr-2 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
            <span>Day {journey.current_day} of {journey.total_days}</span>
            <span>{progressPercent}% complete</span>
          </div>
          <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{
                background: enemyInfo
                  ? `linear-gradient(to right, ${enemyInfo.color}, ${enemyInfo.color}99)`
                  : 'linear-gradient(to right, #d4a44c, #e8b54a)',
              }}
            />
          </div>
        </div>

        {/* Day selector */}
        <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5">
            {Array.from({ length: journey.total_days }, (_, i) => i + 1).map((day) => {
              const isCompleted = day <= journey.days_completed
              const isCurrent = day === journey.current_day
              const isAccessible = day <= journey.current_day
              const isSelected = day === selectedDay

              return (
                <button
                  key={day}
                  onClick={() => isAccessible && handleSelectDay(day)}
                  disabled={!isAccessible}
                  className={`flex-shrink-0 w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#d4a44c] text-black'
                      : isCompleted
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : isCurrent
                      ? 'bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30'
                      : isAccessible
                      ? 'bg-white/10 text-white/70'
                      : 'bg-white/[0.04] text-white/20'
                  }`}
                >
                  {isCompleted && !isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 mx-auto" />
                  ) : (
                    day
                  )}
                </button>
              )
            })}
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
            className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#0d0d12] p-3 space-y-2"
          >
            <div className="flex items-center justify-between px-2 pb-2 border-b border-white/[0.06]">
              <span className="text-xs text-white/50">{getJourneyStatusLabel(journey.status)}</span>
              <button onClick={() => setShowActions(false)}>
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
            {journey.status === 'active' && (
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#d4a44c]/10 text-[#d4a44c] text-sm disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                {actionLoading === 'pause' ? 'Pausing...' : 'Pause Journey'}
              </button>
            )}
            {journey.status === 'paused' && (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-500/10 text-green-400 text-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {actionLoading === 'resume' ? 'Resuming...' : 'Resume Journey'}
              </button>
            )}
            {(journey.status === 'active' || journey.status === 'paused') && (
              <button
                onClick={() => handleAction('abandon')}
                disabled={actionLoading !== null}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {actionLoading === 'abandon' ? 'Abandoning...' : 'Abandon Journey'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-300 underline mt-1">
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step content */}
      <div className="px-4 py-4 pb-8 space-y-5">
        {step ? (
          <>
            {/* Step title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4a44c]/10 border border-[#d4a44c]/20 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a44c] animate-pulse" />
                <span className="text-xs font-medium text-[#d4a44c]">Day {step.day_index}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{step.step_title}</h2>
            </div>

            {/* Teaching */}
            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#d4a44c] to-orange-500" />
              <div className="p-5 pl-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-[#d4a44c]" />
                  <span className="text-xs font-semibold text-[#d4a44c] uppercase tracking-wider">Teaching</span>
                </div>
                <p className="text-white/90 leading-relaxed">{step.teaching}</p>
              </div>
            </section>

            {/* Verses */}
            {step.verses.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4a44c]" />
                  <span className="text-sm font-semibold text-white">Wisdom from the Gita</span>
                </div>
                {step.verses.map((verse, idx) => (
                  <div
                    key={`${verse.chapter}-${verse.verse}-${idx}`}
                    className="rounded-2xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#d4a44c]/5 to-transparent overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#d4a44c]/10 flex items-center gap-2">
                      <span className="text-[#d4a44c] text-sm">ॐ</span>
                      <span className="text-xs text-[#d4a44c]/80">
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </span>
                    </div>
                    {verse.sanskrit && (
                      <div className="px-4 py-3 bg-[#d4a44c]/[0.03]">
                        <p className="text-[#d4a44c]/90 text-center leading-relaxed">{verse.sanskrit}</p>
                        {verse.transliteration && (
                          <p className="text-xs text-[#d4a44c]/60 italic text-center mt-1">{verse.transliteration}</p>
                        )}
                      </div>
                    )}
                    <div className="px-4 py-3">
                      <p className="text-white/90 leading-relaxed text-sm">{verse.english}</p>
                    </div>
                    {verse.hindi && (
                      <div className="px-4 py-2 border-t border-[#d4a44c]/10">
                        <p className="text-white/60 text-xs leading-relaxed">{verse.hindi}</p>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* Guided Reflection */}
            {step.guided_reflection.length > 0 && (
              <section className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-950/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-violet-500" />
                <div className="p-5 pl-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Reflection</span>
                  </div>
                  <ul className="space-y-3">
                    {step.guided_reflection.map((prompt, idx) => (
                      <li key={idx} className="flex gap-3 text-white/90 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400 font-medium">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Practice */}
            {step.practice && Object.keys(step.practice).length > 0 && (
              <section className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-green-950/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-500" />
                <div className="p-5 pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Practice</span>
                    </div>
                    {typeof step.practice.duration_minutes === 'number' && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">
                        {step.practice.duration_minutes} min
                      </span>
                    )}
                  </div>
                  {typeof step.practice.name === 'string' && (
                    <p className="font-semibold text-white mb-3">{step.practice.name}</p>
                  )}
                  {Array.isArray(step.practice.instructions) && (
                    <ol className="space-y-2.5">
                      {(step.practice.instructions as string[]).map((instruction, idx) => (
                        <li key={idx} className="flex gap-3 text-white/90 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[10px] text-green-400 font-bold">
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

            {/* Micro commitment */}
            {step.micro_commitment && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Micro Commitment</p>
                <p className="text-white/90 text-sm italic">&ldquo;{step.micro_commitment}&rdquo;</p>
              </div>
            )}

            {/* Safety note */}
            {step.safety_note && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-300/90 leading-relaxed">{step.safety_note}</p>
                </div>
              </div>
            )}

            {/* Completion area */}
            {!step.is_completed && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setShowReflection(!showReflection)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm text-white/60"
                >
                  {showReflection ? 'Hide Reflection' : 'Add Reflection (Optional)'}
                </button>

                <AnimatePresence>
                  {showReflection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <textarea
                        value={reflection}
                        onChange={(e) => setReflection(e.target.value)}
                        placeholder="What insights arose today?"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#0d0d12] p-4 text-white placeholder:text-white/30 focus:border-[#d4a44c]/40 outline-none resize-none text-sm"
                        rows={4}
                        maxLength={5000}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCompleteStep}
                  disabled={isCompleting}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#d4a44c] via-orange-500 to-[#d4a44c] py-4 text-base font-bold text-black disabled:opacity-50 shadow-lg shadow-[#d4a44c]/20"
                >
                  {isCompleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Completing...
                    </span>
                  ) : (
                    "Complete Today's Step"
                  )}
                </motion.button>
              </div>
            )}

            {/* Already completed */}
            {step.is_completed && (
              <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-semibold">Step Completed</p>
                {step.completed_at && (
                  <p className="text-xs text-white/50 mt-1">
                    {new Date(step.completed_at).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            )}
          </>
        ) : journey.status === 'paused' ? (
          <div className="text-center py-12">
            <Pause className="w-12 h-12 text-[#d4a44c] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Journey Paused</h2>
            <p className="text-sm text-white/60 mb-6">Resume to continue your transformation.</p>
            <button
              onClick={() => handleAction('resume')}
              disabled={actionLoading !== null}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a44c] to-orange-500 text-black font-medium disabled:opacity-50"
            >
              {actionLoading === 'resume' ? 'Resuming...' : 'Resume Journey'}
            </button>
          </div>
        ) : journey.status === 'completed' ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🙏</div>
            <h2 className="text-xl font-bold text-white mb-2">Journey Complete</h2>
            <p className="text-sm text-white/60 mb-6">
              You have completed all {journey.total_days} days. Your dedication to inner transformation is inspiring.
            </p>
            <button
              onClick={() => router.push('/m/journeys')}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4a44c] to-orange-500 text-black font-medium"
            >
              Explore More Journeys
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d4a44c] border-t-transparent" />
          </div>
        )}
      </div>
    </MobileAppShell>
  )
}
