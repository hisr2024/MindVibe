'use client'

/**
 * Journey Detail Page - Daily Step Interface
 *
 * Shows the current day's teachings, reflection prompts, Gita verses,
 * and allows users to complete steps with their reflections.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ENEMY_INFO,
  type JourneyStats,
  type DailyStep,
  type EnemyType,
  getJourneyStatusLabel,
} from '@/types/journeyEngine.types'
import { journeyEngineService, JourneyEngineError } from '@/services/journeyEngineService'

export default function JourneyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const journeyId = params.id as string

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [journey, setJourney] = useState<JourneyStats | null>(null)
  const [currentStep, setCurrentStep] = useState<DailyStep | null>(null)
  const [reflection, setReflection] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Load journey and current step
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [journeyData, stepData] = await Promise.all([
        journeyEngineService.getJourney(journeyId),
        journeyEngineService.getCurrentStep(journeyId),
      ])

      setJourney(journeyData)
      setCurrentStep(stepData)
      setSelectedDay(stepData?.day_index || journeyData.current_day_index)
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isAuthError()) {
          setError('Please sign in to access this journey')
        } else if (err.isNotFoundError()) {
          setError('Journey not found')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load journey')
      }
    } finally {
      setIsLoading(false)
    }
  }, [journeyId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load a specific day's step
  const loadStep = async (dayIndex: number) => {
    try {
      const step = await journeyEngineService.getStep(journeyId, dayIndex)
      setCurrentStep(step)
      setSelectedDay(dayIndex)
      setReflection(step.user_reflection || '')
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        setError(err.message)
      }
    }
  }

  // Complete current step
  const handleCompleteStep = async () => {
    if (!currentStep || currentStep.is_completed) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await journeyEngineService.completeStep(journeyId, currentStep.day_index, {
        reflection: reflection || undefined,
      })

      setShowSuccess(true)

      if (result.journey_completed) {
        setTimeout(() => {
          router.push('/journey-engine')
        }, 3000)
      } else if (result.next_step) {
        setTimeout(() => {
          setShowSuccess(false)
          setCurrentStep(result.next_step)
          setSelectedDay(result.next_step?.day_index || null)
          setReflection('')
        }, 2000)
      } else {
        setTimeout(() => {
          loadData()
          setShowSuccess(false)
        }, 2000)
      }
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        setError(err.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get enemy info for this journey
  const primaryEnemy = journey?.enemy_tags?.[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Loading your journey...</p>
        </div>
      </div>
    )
  }

  if (error || !journey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🙏</div>
          <h2 className="text-2xl font-bold text-white mb-2">Journey Not Found</h2>
          <p className="text-white/60 mb-6">{error || 'This journey may have been completed or removed.'}</p>
          <Link
            href="/journey-engine"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all"
          >
            Back to Journeys
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/journey-engine" className="text-white/60 hover:text-white transition-colors">
            &larr; All Journeys
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">{journey.template_title}</h1>
            <p className="text-xs text-white/50">
              Day {journey.current_day_index} of {journey.duration_days} | {journey.progress_percent}% complete
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            journey.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {getJourneyStatusLabel(journey.status)}
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${journey.progress_percent}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 max-w-4xl mx-auto">
        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">Step Complete!</h2>
              <p className="text-white/60">
                Beautiful work on today&apos;s practice. Your reflection has been saved.
              </p>
            </div>
          </div>
        )}

        {/* Day Navigation */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {Array.from({ length: journey.duration_days }, (_, i) => i + 1).map((day) => {
              const isCompleted = day < journey.current_day_index ||
                (day === journey.current_day_index && currentStep?.is_completed)
              const isCurrent = day === journey.current_day_index
              const isSelected = day === selectedDay
              const isAccessible = day <= journey.current_day_index

              return (
                <button
                  key={day}
                  onClick={() => isAccessible && loadStep(day)}
                  disabled={!isAccessible}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white scale-110'
                      : isCompleted
                      ? 'bg-green-500/30 text-green-400 border border-green-500/30'
                      : isCurrent
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/30'
                      : 'bg-white/5 text-white/30 border border-white/10'
                    }
                    ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  `}
                >
                  {isCompleted && day !== selectedDay ? '✓' : day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        {currentStep ? (
          <div className="space-y-6">
            {/* Enemy Badge */}
            {enemyInfo && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${enemyInfo.gradient} flex items-center justify-center text-2xl`}>
                  {enemyInfo.icon === 'flame' ? '🔥' : enemyInfo.icon === 'zap' ? '⚡' : enemyInfo.icon === 'coins' ? '💰' : enemyInfo.icon === 'cloud' ? '☁️' : enemyInfo.icon === 'crown' ? '👑' : '👁️'}
                </div>
                <div>
                  <div className="text-sm text-white/50">Working on conquering</div>
                  <div className="font-semibold text-white">{enemyInfo.sanskrit} ({enemyInfo.name})</div>
                </div>
              </div>
            )}

            {/* Step Title */}
            <div className="text-center">
              <div className="text-sm text-purple-400 mb-1">Day {currentStep.day_index}</div>
              <h2 className="text-2xl font-bold text-white">{currentStep.step_title}</h2>
            </div>

            {/* Teaching */}
            {currentStep.teaching_hint && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
                  Today&apos;s Teaching
                </h3>
                <p className="text-white/90 leading-relaxed">{currentStep.teaching_hint}</p>
              </div>
            )}

            {/* Gita Verse */}
            {currentStep.verse && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
                  Bhagavad Gita Wisdom
                </h3>
                <div className="text-xs text-amber-300/70 mb-2">
                  Chapter {currentStep.verse.chapter}, Verse {currentStep.verse.verse}
                </div>
                {currentStep.verse.sanskrit && (
                  <p className="text-amber-200/80 font-serif italic mb-3">{currentStep.verse.sanskrit}</p>
                )}
                <p className="text-white/90 leading-relaxed">&ldquo;{currentStep.verse.english}&rdquo;</p>
              </div>
            )}

            {/* Modern Example */}
            {currentStep.modern_example && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3">
                  Real-Life Example
                </h3>
                <p className="text-white/80 mb-4">{currentStep.modern_example.scenario}</p>
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="text-sm text-white/60 mb-1">The Antidote:</div>
                  <p className="text-white/90">{currentStep.modern_example.practical_antidote}</p>
                </div>
              </div>
            )}

            {/* Practice Prompt */}
            {currentStep.practice_prompt && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-3">
                  Today&apos;s Practice
                </h3>
                <p className="text-white/90 leading-relaxed">{currentStep.practice_prompt}</p>
              </div>
            )}

            {/* Reflection Prompt */}
            {currentStep.reflection_prompt && (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
                  Reflection Question
                </h3>
                <p className="text-white/90 mb-4">{currentStep.reflection_prompt}</p>

                {!currentStep.is_completed ? (
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Write your reflection here... (optional)"
                    className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                ) : currentStep.user_reflection ? (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-xs text-white/50 mb-2">Your reflection:</div>
                    <p className="text-white/80 italic">{currentStep.user_reflection}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Safety Notes */}
            {currentStep.safety_notes && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-300 text-sm">
                  <span className="font-semibold">Note:</span> {currentStep.safety_notes}
                </p>
              </div>
            )}

            {/* Complete Button */}
            {!currentStep.is_completed && journey.status === 'active' && (
              <div className="pt-4">
                <button
                  onClick={handleCompleteStep}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Completing...' : 'Complete Today\'s Step'}
                </button>
              </div>
            )}

            {/* Already Completed */}
            {currentStep.is_completed && (
              <div className="text-center p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-green-400 font-medium">This step is complete</p>
                {currentStep.completed_at && (
                  <p className="text-green-300/60 text-sm mt-1">
                    Completed on {new Date(currentStep.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Journey Paused */}
            {journey.status === 'paused' && (
              <div className="text-center p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-amber-400 font-medium mb-3">This journey is paused</p>
                <button
                  onClick={async () => {
                    try {
                      await journeyEngineService.resumeJourney(journeyId)
                      loadData()
                    } catch (err) {
                      if (err instanceof JourneyEngineError) {
                        setError(err.message)
                      }
                    }
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all"
                >
                  Resume Journey
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Journey Complete!</h2>
            <p className="text-white/60 mb-6">
              You&apos;ve completed all steps in this journey. Congratulations on your progress!
            </p>
            <Link
              href="/journey-engine"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              Start Another Journey
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
