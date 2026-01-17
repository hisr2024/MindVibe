'use client'

import { BookOpen, Sparkles, MessageSquare } from 'lucide-react'
import type { JourneyStep } from '@/types/wisdomJourney.types'

interface VerseCardProps {
  step: JourneyStep
  onComplete: () => void
  isCurrentStep?: boolean
}

/**
 * VerseCard component displays a Gita verse with reflection prompt and AI insight.
 *
 * Features:
 * - Verse text with translation
 * - Chapter and verse reference
 * - Reflection prompt with icon
 * - AI-generated insight
 * - Complete step button
 * - Elegant card design with gradients
 */
export function VerseCard({ step, onComplete, isCurrentStep = false }: VerseCardProps) {
  if (!step.verse_text) {
    return (
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 text-center">
        <p className="text-orange-100/70">Verse content not available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Verse Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-900/20 via-purple-900/20 to-gray-900/50 p-8 backdrop-blur-sm">
        {/* Decorative Corner Accent */}
        <div className="absolute right-0 top-0 h-32 w-32 bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-purple-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-50">
                Bhagavad Gita {step.verse_chapter}:{step.verse_number}
              </h3>
              <p className="text-xs text-orange-100/60">Step {step.step_number}</p>
            </div>
          </div>

          {isCurrentStep && (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              Current Step
            </span>
          )}
        </div>

        {/* Verse Text */}
        <div className="relative mt-6 rounded-xl border border-white/5 bg-black/20 p-6">
          <p className="text-lg leading-relaxed text-orange-50">{step.verse_text}</p>

          {step.verse_translation && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-sm italic text-orange-100/70">{step.verse_translation}</p>
            </div>
          )}
        </div>

        {/* Reflection Prompt */}
        {step.reflection_prompt && (
          <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                <MessageSquare className="h-4 w-4 text-purple-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-purple-200">Reflection Prompt</h4>
                <p className="mt-1 text-sm text-purple-100/70">{step.reflection_prompt}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Insight */}
        {step.ai_insight && (
          <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20">
                <Sparkles className="h-4 w-4 text-orange-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-orange-200">AI Insight</h4>
                <p className="mt-1 text-sm text-orange-100/70">{step.ai_insight}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complete Step Button */}
      {!step.completed && isCurrentStep && (
        <div className="flex justify-center">
          <button
            onClick={onComplete}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:from-orange-600 hover:to-purple-700 hover:shadow-lg hover:shadow-purple-500/50"
          >
            <span className="relative z-10 flex items-center gap-2">
              Complete This Step
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </span>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>
        </div>
      )}

      {/* Completed Badge */}
      {step.completed && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">✓</span>
            <div>
              <p className="font-semibold text-emerald-300">Step Completed</p>
              {step.completed_at && (
                <p className="text-xs text-emerald-400/70">
                  {new Date(step.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {step.user_rating && (
            <div className="mt-3 flex items-center justify-center gap-1 text-amber-400">
              <span className="text-sm">Your rating:</span>
              <span className="text-lg">{'⭐'.repeat(step.user_rating)}</span>
            </div>
          )}

          {step.user_notes && (
            <div className="mt-3 rounded-lg bg-black/20 p-3 text-left">
              <p className="text-xs font-semibold text-emerald-200">Your Notes:</p>
              <p className="mt-1 text-sm text-emerald-100/70">{step.user_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Guidance Text */}
      {!step.completed && isCurrentStep && (
        <p className="text-center text-xs text-orange-100/50">
          💡 Take your time to reflect on this verse. There's no rush to complete your journey.
        </p>
      )}
    </div>
  )
}
