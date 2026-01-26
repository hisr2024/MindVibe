'use client'

import { useState, useEffect } from 'react'
import { Loader2, Play, Pause, Trash2, ArrowLeft } from 'lucide-react'
import { JourneyRecommendations } from '@/components/wisdom-journey/JourneyRecommendations'
import { JourneyTimeline } from '@/components/wisdom-journey/JourneyTimeline'
import { VerseCard } from '@/components/wisdom-journey/VerseCard'
import { ProgressModal } from '@/components/wisdom-journey/ProgressModal'
import type { WisdomJourney, JourneyRecommendation, JourneyStep } from '@/types/wisdomJourney.types'
import * as wisdomJourneyService from '@/services/wisdomJourneyService'

type View = 'overview' | 'recommendations' | 'journey' | 'step'

/**
 * Generate or retrieve a persistent user ID for the Wisdom Journey feature.
 * In production, this should come from Firebase auth or an auth context.
 */
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'demo-user'

  // Try multiple localStorage keys for compatibility
  const storedId = localStorage.getItem('user_id') ||
                   localStorage.getItem('mindvibe_user_id') ||
                   localStorage.getItem('mindvibe_uid')

  if (storedId && storedId !== 'undefined' && storedId !== 'null') {
    return storedId
  }

  // Generate a new user ID if none exists
  const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  localStorage.setItem('user_id', newUserId)
  localStorage.setItem('mindvibe_user_id', newUserId)

  return newUserId
}

export default function WisdomJourneyClient() {
  const [userId, setUserId] = useState<string>('demo-user')
  const [view, setView] = useState<View>('overview')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeJourney, setActiveJourney] = useState<WisdomJourney | null>(null)
  const [recommendations, setRecommendations] = useState<JourneyRecommendation[]>([])
  const [selectedStep, setSelectedStep] = useState<JourneyStep | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize user ID on mount
  useEffect(() => {
    const id = getOrCreateUserId()
    setUserId(id)
  }, [])

  // Load active journey and recommendations
  useEffect(() => {
    // Allow loading even for demo users
    if (!userId) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [journey, recs] = await Promise.all([
          wisdomJourneyService.getActiveJourney(userId),
          wisdomJourneyService.getJourneyRecommendations(userId),
        ])

        setActiveJourney(journey)
        setRecommendations(recs)

        // Set initial view based on data
        if (journey) {
          setView('journey')
          const nextStep = wisdomJourneyService.getNextStep(journey)
          if (nextStep) {
            setSelectedStep(nextStep)
          }
        } else {
          setView('recommendations')
        }
      } catch (err) {
        console.error('Error loading wisdom journey data:', err)
        setError('Failed to load journey data. Please try again.')
        // Still show recommendations view on error
        setView('recommendations')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleStartJourney = async (template: string, title: string) => {
    if (!userId) return

    try {
      setActionLoading(true)
      setError(null)

      const journey = await wisdomJourneyService.generateJourney(userId, {
        duration_days: 7,
        custom_title: title,
      })

      setActiveJourney(journey)
      setView('journey')

      // Select first step
      if (journey.steps.length > 0) {
        setSelectedStep(journey.steps[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start journey')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePauseJourney = async () => {
    if (!userId || !activeJourney) return

    try {
      setActionLoading(true)
      setError(null)

      const updated = await wisdomJourneyService.pauseJourney(userId, activeJourney.id)
      setActiveJourney(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause journey')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResumeJourney = async () => {
    if (!userId || !activeJourney) return

    try {
      setActionLoading(true)
      setError(null)

      const updated = await wisdomJourneyService.resumeJourney(userId, activeJourney.id)
      setActiveJourney(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume journey')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteJourney = async () => {
    if (!userId || !activeJourney) return

    if (!confirm('Are you sure you want to delete this journey? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(true)
      setError(null)

      await wisdomJourneyService.deleteJourney(userId, activeJourney.id)
      setActiveJourney(null)
      setView('recommendations')

      // Reload recommendations
      const recs = await wisdomJourneyService.getJourneyRecommendations(userId)
      setRecommendations(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete journey')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStepClick = (stepNumber: number) => {
    if (!activeJourney || !activeJourney.steps || !Array.isArray(activeJourney.steps)) return

    const step = activeJourney.steps.find((s) => s.step_number === stepNumber)
    if (step) {
      setSelectedStep(step)
      setView('step')
    }
  }

  const handleCompleteStep = () => {
    setShowProgressModal(true)
  }

  const handleProgressSubmit = async (data: {
    time_spent_seconds?: number
    user_notes?: string
    user_rating?: number
  }) => {
    if (!userId || !activeJourney || !selectedStep) return

    await wisdomJourneyService.markStepComplete(userId, activeJourney.id, {
      step_number: selectedStep.step_number,
      ...data,
    })

    // Reload journey
    const updated = await wisdomJourneyService.getJourney(userId, activeJourney.id)
    setActiveJourney(updated)

    // Move to next step or journey view
    const nextStep = wisdomJourneyService.getNextStep(updated)
    if (nextStep) {
      setSelectedStep(nextStep)
    } else {
      setView('journey')
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-lg text-orange-100/70">Loading your wisdom journey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20 py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-50">Wisdom Journeys</h1>
              <p className="mt-2 text-orange-100/70">
                AI-powered personalized paths through Bhagavad Gita wisdom
              </p>
            </div>

            {view !== 'recommendations' && view !== 'overview' && (
              <button
                onClick={() => setView(activeJourney ? 'journey' : 'recommendations')}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-orange-100 transition-colors hover:bg-white/5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Content */}
        {(view === 'recommendations' || view === 'overview') && (
          <JourneyRecommendations
            recommendations={recommendations}
            onSelect={handleStartJourney}
            loading={actionLoading}
          />
        )}

        {view === 'journey' && activeJourney && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Sidebar - Journey Timeline */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 backdrop-blur-sm">
                {/* Show message if journey has no valid steps */}
                {(!activeJourney.steps || !Array.isArray(activeJourney.steps) || activeJourney.steps.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-orange-100/70 mb-4">Journey data is incomplete.</p>
                    <button
                      onClick={() => {
                        setActiveJourney(null)
                        setView('recommendations')
                      }}
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-orange-600 hover:to-purple-700"
                    >
                      Start a New Journey
                    </button>
                  </div>
                ) : (
                  <JourneyTimeline journey={activeJourney} onStepClick={handleStepClick} />
                )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {activeJourney.status === 'active' && (
                    <button
                      onClick={handlePauseJourney}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Pause className="h-4 w-4" />
                      Pause Journey
                    </button>
                  )}

                  {activeJourney.status === 'paused' && (
                    <button
                      onClick={handleResumeJourney}
                      disabled={actionLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4" />
                      Resume Journey
                    </button>
                  )}

                  <button
                    onClick={handleDeleteJourney}
                    disabled={actionLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Journey
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content - Journey Info */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-orange-50">{activeJourney.title}</h2>
                {activeJourney.description && (
                  <p className="mt-2 text-orange-100/70">{activeJourney.description}</p>
                )}

                {activeJourney.recommendation_reason && (
                  <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/10 p-4">
                    <p className="text-sm text-purple-100/70">
                      <span className="font-semibold text-purple-200">Why this journey: </span>
                      {activeJourney.recommendation_reason}
                    </p>
                  </div>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-black/20 p-4 text-center">
                    <p className="text-2xl font-bold text-orange-50">{activeJourney.total_steps}</p>
                    <p className="mt-1 text-xs text-orange-100/60">Total Steps</p>
                  </div>
                  <div className="rounded-lg bg-black/20 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-300">{activeJourney.current_step}</p>
                    <p className="mt-1 text-xs text-orange-100/60">Completed</p>
                  </div>
                  <div className="rounded-lg bg-black/20 p-4 text-center">
                    <p className="text-2xl font-bold text-purple-300">
                      {activeJourney.progress_percentage}%
                    </p>
                    <p className="mt-1 text-xs text-orange-100/60">Progress</p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => {
                      const nextStep = wisdomJourneyService.getNextStep(activeJourney)
                      if (nextStep) {
                        handleStepClick(nextStep.step_number)
                      }
                    }}
                    className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-orange-600 hover:to-purple-700"
                  >
                    Continue Journey →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'step' && selectedStep && activeJourney && (
          <VerseCard
            step={selectedStep}
            onComplete={handleCompleteStep}
            isCurrentStep={selectedStep.step_number === activeJourney.current_step + 1}
          />
        )}

        {/* Progress Modal */}
        {selectedStep && (
          <ProgressModal
            isOpen={showProgressModal}
            onClose={() => setShowProgressModal(false)}
            onSubmit={handleProgressSubmit}
            stepNumber={selectedStep.step_number}
          />
        )}
      </div>
    </div>
  )
}
