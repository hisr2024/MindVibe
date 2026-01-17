'use client'

import { CheckCircle, Circle, Lock } from 'lucide-react'
import type { WisdomJourney } from '@/types/wisdomJourney.types'

interface JourneyTimelineProps {
  journey: WisdomJourney
  onStepClick?: (stepNumber: number) => void
}

/**
 * JourneyTimeline component displays visual progress through a wisdom journey.
 *
 * Features:
 * - Vertical timeline with step bubbles
 * - Visual indicators for completed/current/locked steps
 * - Progress line connecting steps
 * - Click to view step details (if provided)
 * - Responsive layout
 */
export function JourneyTimeline({ journey, onStepClick }: JourneyTimelineProps) {
  const getStepStatus = (step: typeof journey.steps[0], index: number) => {
    if (step.completed) return 'completed'
    if (index === journey.current_step) return 'current'
    if (index < journey.current_step) return 'unlocked'
    return 'locked'
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 border-emerald-400 text-white'
      case 'current':
        return 'bg-gradient-to-br from-orange-500 to-purple-600 border-orange-400 text-white animate-pulse'
      case 'unlocked':
        return 'bg-blue-500/20 border-blue-400 text-blue-300'
      case 'locked':
        return 'bg-gray-700/50 border-gray-600 text-gray-400'
      default:
        return 'bg-gray-700/50 border-gray-600 text-gray-400'
    }
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />
      case 'current':
        return <Circle className="h-5 w-5 fill-current" />
      case 'locked':
        return <Lock className="h-4 w-4" />
      default:
        return <Circle className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-orange-50">Journey Progress</h3>
          <p className="text-sm text-orange-100/70">
            {journey.current_step} of {journey.total_steps} steps completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-50">{journey.progress_percentage}%</div>
          <div className="text-xs text-orange-100/70">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-gray-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-500"
          style={{ width: `${journey.progress_percentage}%` }}
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-orange-500/50 via-purple-600/50 to-gray-700/50" />

        {/* Steps */}
        <div className="space-y-4">
          {journey.steps.map((step, index) => {
            const status = getStepStatus(step, index)
            const isClickable = onStepClick && (status === 'completed' || status === 'current')

            return (
              <div
                key={step.id}
                onClick={() => isClickable && onStepClick(step.step_number)}
                className={`relative flex items-start gap-4 ${isClickable ? 'cursor-pointer' : ''}`}
              >
                {/* Step Circle */}
                <div
                  className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${getStepColor(status)} ${isClickable ? 'hover:scale-110' : ''}`}
                >
                  {getIcon(status)}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-orange-50">Step {step.step_number}</h4>
                    {step.completed && step.user_rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-400">
                        <span>{'⭐'.repeat(step.user_rating)}</span>
                      </div>
                    )}
                  </div>

                  {step.verse_chapter && step.verse_number && (
                    <p className="mt-1 text-xs text-orange-100/60">
                      Bhagavad Gita {step.verse_chapter}:{step.verse_number}
                    </p>
                  )}

                  {step.reflection_prompt && status !== 'locked' && (
                    <p className="mt-2 text-sm text-orange-100/70 line-clamp-2">
                      {step.reflection_prompt}
                    </p>
                  )}

                  {step.completed && step.completed_at && (
                    <p className="mt-2 text-xs text-emerald-400">
                      ✓ Completed {new Date(step.completed_at).toLocaleDateString()}
                    </p>
                  )}

                  {status === 'current' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStepClick?.(step.step_number)
                      }}
                      className="mt-3 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:from-orange-600 hover:to-purple-700"
                    >
                      Begin This Step →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Journey Complete Message */}
      {journey.status === 'completed' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <div className="text-4xl">🎉</div>
          <h3 className="mt-2 text-lg font-semibold text-emerald-300">Journey Complete!</h3>
          <p className="mt-1 text-sm text-emerald-400/70">
            You've completed all {journey.total_steps} steps of this wisdom journey.
          </p>
          {journey.completed_at && (
            <p className="mt-2 text-xs text-emerald-400/60">
              Completed on {new Date(journey.completed_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
