'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Star,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import * as journeysService from '@/services/journeysEnhancedService'
import type { TodayAgenda, TodayAgendaStep } from '@/services/journeysEnhancedService'
import StepView from '../components/StepView'

export default function TodayAgendaClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [agenda, setAgenda] = useState<TodayAgenda | null>(null)
  const [selectedStep, setSelectedStep] = useState<TodayAgendaStep | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAgenda()
  }, [])

  async function loadAgenda() {
    try {
      setLoading(true)
      setError(null)
      const data = await journeysService.getTodayAgenda()
      setAgenda(data)

      // Auto-select priority step if available
      if (data.priority_step) {
        setSelectedStep(data.priority_step)
      } else if (data.steps.length > 0) {
        setSelectedStep(data.steps[0])
      }
    } catch (err) {
      console.error('Failed to load agenda:', err)
      setError('Failed to load today\'s agenda. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStepComplete(
    userJourneyId: string,
    dayIndex: number,
    checkIn?: { intensity: number; label: string },
    reflection?: string
  ) {
    try {
      await journeysService.completeStep(userJourneyId, dayIndex, {
        check_in: checkIn,
        reflection_response: reflection,
      })

      // Reload agenda
      await loadAgenda()
    } catch (err) {
      console.error('Failed to complete step:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-orange-500" />
          <p className="mt-4 text-lg text-orange-100/70">Loading today&apos;s wisdom...</p>
        </div>
      </div>
    )
  }

  // No active journeys
  if (!agenda || agenda.steps.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20">
        <div className="text-center">
          <Sparkles className="mx-auto h-16 w-16 text-orange-500/50" />
          <h2 className="mt-4 text-2xl font-bold text-orange-50">No Active Journeys</h2>
          <p className="mt-2 max-w-md text-orange-100/60">
            {agenda?.message || 'Start a wisdom journey to begin your path to inner peace.'}
          </p>
          <button
            onClick={() => router.push('/journeys')}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-orange-600 hover:to-purple-700"
          >
            <BookOpen className="h-5 w-5" />
            Browse Journeys
          </button>
        </div>
      </div>
    )
  }

  // If viewing a step
  if (selectedStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Back Button */}
          <button
            onClick={() => setSelectedStep(null)}
            className="mb-6 flex items-center gap-2 text-orange-100/70 hover:text-orange-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Today&apos;s Agenda
          </button>

          {/* Step View */}
          <StepView
            step={selectedStep}
            onComplete={handleStepComplete}
            onClose={() => setSelectedStep(null)}
          />
        </div>
      </div>
    )
  }

  // Today's Agenda List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-orange-900/20 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-orange-50">Today&apos;s Wisdom</h1>
            <p className="mt-2 text-orange-100/70">
              {agenda.active_journey_count} active journey
              {(agenda.active_journey_count || 0) > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => router.push('/journeys')}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-orange-100 hover:bg-white/5"
          >
            <BookOpen className="h-4 w-4" />
            Browse Journeys
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Priority Step Highlight */}
        {agenda.priority_step && !agenda.priority_step.completed && (
          <div className="mb-8">
            <div className="flex items-center gap-2 text-amber-300">
              <Star className="h-5 w-5 fill-amber-300" />
              <span className="text-sm font-medium">Recommended Focus</span>
            </div>
            <button
              onClick={() => setSelectedStep(agenda.priority_step!)}
              className="mt-3 w-full rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-left transition-all hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-300">
                    {agenda.priority_step.journey_title}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-orange-50">
                    {agenda.priority_step.kiaan_step?.step_title || `Day ${agenda.priority_step.day_index}`}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-orange-100/60">
                    {agenda.priority_step.kiaan_step?.teaching?.slice(0, 150)}...
                  </p>
                </div>
                <ChevronRight className="h-6 w-6 text-amber-300" />
              </div>
            </button>
          </div>
        )}

        {/* All Steps */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-orange-100">All Today&apos;s Steps</h2>

          {agenda.steps.map((step) => {
            const isPriority = agenda.priority_step?.step_state_id === step.step_state_id

            return (
              <button
                key={step.step_state_id}
                onClick={() => setSelectedStep(step)}
                className={`w-full rounded-xl border p-5 text-left transition-all ${
                  step.completed
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isPriority
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {step.completed ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                        <span className="text-sm font-bold text-orange-300">
                          {step.day_index}
                        </span>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-medium text-orange-100/50">
                        {step.journey_title}
                      </p>
                      <h3 className="font-semibold text-orange-50">
                        {step.kiaan_step?.step_title || `Day ${step.day_index}`}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-orange-100/40">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {step.verse_refs.length} verse{step.verse_refs.length > 1 ? 's' : ''}
                        </span>
                        {step.kiaan_step?.practice && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {step.kiaan_step.practice.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {step.completed && (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                        Completed
                      </span>
                    )}
                    <ChevronRight className="h-5 w-5 text-orange-100/30" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Progress Summary */}
        <div className="mt-8 rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
          <h3 className="text-lg font-semibold text-orange-100">Today&apos;s Progress</h3>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-50">{agenda.steps.length}</p>
              <p className="text-xs text-orange-100/50">Total Steps</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-300">
                {agenda.steps.filter((s) => s.completed).length}
              </p>
              <p className="text-xs text-orange-100/50">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-300">
                {agenda.steps.filter((s) => !s.completed).length}
              </p>
              <p className="text-xs text-orange-100/50">Remaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
