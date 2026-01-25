'use client'

import { useState } from 'react'
import {
  BookOpen,
  MessageCircle,
  Target,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { TodayAgendaStep } from '@/services/journeysEnhancedService'

interface StepViewProps {
  step: TodayAgendaStep
  onComplete: (
    userJourneyId: string,
    dayIndex: number,
    checkIn?: { intensity: number; label: string },
    reflection?: string
  ) => Promise<void>
  onClose: () => void
}

export default function StepView({ step, onComplete, onClose }: StepViewProps) {
  const [completing, setCompleting] = useState(false)
  const [intensity, setIntensity] = useState(5)
  const [reflection, setReflection] = useState('')
  const [showReflection, setShowReflection] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kiaan = step.kiaan_step

  // Handle safety response
  if (kiaan?.is_safety_response) {
    return (
      <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/10 p-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-8 w-8 flex-shrink-0 text-red-400" />
          <div>
            <h2 className="text-xl font-bold text-red-100">We&apos;re Here For You</h2>
            <p className="mt-4 text-red-100/80">{kiaan.safety_message}</p>

            {kiaan.crisis_resources && kiaan.crisis_resources.length > 0 && (
              <div className="mt-6 rounded-lg bg-red-500/10 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-red-200">
                  <Phone className="h-4 w-4" />
                  Crisis Resources
                </h3>
                <ul className="mt-3 space-y-2">
                  {kiaan.crisis_resources.map((resource, i) => (
                    <li key={i} className="text-sm text-red-100/70">
                      {resource}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-red-500/20 px-6 py-3 font-medium text-red-100 hover:bg-red-500/30"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    )
  }

  async function handleComplete() {
    try {
      setCompleting(true)
      setError(null)

      const checkIn = kiaan?.check_in_prompt
        ? { intensity, label: kiaan.check_in_prompt.label }
        : undefined

      await onComplete(step.user_journey_id, step.day_index, checkIn, reflection || undefined)

      onClose()
    } catch (err) {
      console.error('Failed to complete step:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete step')
    } finally {
      setCompleting(false)
    }
  }

  if (!kiaan) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
        <p className="mt-4 text-center text-orange-100/70">Loading step content...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
        <p className="text-sm font-medium text-orange-100/50">
          {step.journey_title} &middot; Day {step.day_index} of {step.total_days}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-orange-50">{kiaan.step_title}</h1>
      </div>

      {/* Verses */}
      {step.verse_texts && step.verse_texts.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-orange-100">
            <BookOpen className="h-5 w-5 text-orange-500" />
            Today&apos;s Wisdom
          </h2>

          <div className="mt-4 space-y-6">
            {step.verse_texts.map((verse) => (
              <div
                key={`${verse.chapter}-${verse.verse}`}
                className="border-l-2 border-orange-500/30 pl-4"
              >
                <p className="text-xs font-medium text-orange-100/50">
                  Chapter {verse.chapter}, Verse {verse.verse}
                </p>

                {verse.sanskrit && (
                  <p className="mt-2 font-sanskrit text-lg text-orange-100/80">{verse.sanskrit}</p>
                )}

                {verse.transliteration && (
                  <p className="mt-1 text-sm italic text-orange-100/50">{verse.transliteration}</p>
                )}

                <p className="mt-3 text-orange-100">{verse.translation}</p>

                {verse.hindi && (
                  <p className="mt-2 text-sm text-orange-100/70">{verse.hindi}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-orange-100">
          <MessageCircle className="h-5 w-5 text-purple-500" />
          KIAAN&apos;s Teaching
        </h2>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-orange-100/80">
          {kiaan.teaching}
        </p>
      </div>

      {/* Guided Reflection */}
      {kiaan.guided_reflection && kiaan.guided_reflection.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
          <h2 className="text-lg font-semibold text-orange-100">Guided Reflection</h2>
          <ul className="mt-4 space-y-3">
            {kiaan.guided_reflection.map((question, i) => (
              <li key={i} className="flex gap-3 text-orange-100/80">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                  {i + 1}
                </span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practice */}
      {kiaan.practice && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-100">
            <Target className="h-5 w-5 text-emerald-500" />
            {kiaan.practice.name}
          </h2>
          <p className="mt-1 text-sm text-emerald-100/60">
            {kiaan.practice.duration_minutes} minutes
          </p>
          <ol className="mt-4 space-y-2">
            {kiaan.practice.instructions.map((instruction, i) => (
              <li key={i} className="flex gap-3 text-emerald-100/80">
                <span className="font-mono text-sm text-emerald-400">{i + 1}.</span>
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Micro Commitment */}
      {kiaan.micro_commitment && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-100">Today&apos;s Commitment</p>
          <p className="mt-1 text-amber-100/80">{kiaan.micro_commitment}</p>
        </div>
      )}

      {/* Check-in and Completion */}
      {!step.completed && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
          {/* Check-in Slider */}
          {kiaan.check_in_prompt && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-orange-100">
                {kiaan.check_in_prompt.label}
              </label>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-sm text-orange-100/50">0</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-sm text-orange-100/50">10</span>
                <span className="ml-2 min-w-[2.5rem] text-center text-lg font-bold text-orange-300">
                  {intensity}
                </span>
              </div>
            </div>
          )}

          {/* Reflection Input */}
          <button
            onClick={() => setShowReflection(!showReflection)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-orange-100 hover:text-orange-50"
          >
            <span>Add Reflection (Optional)</span>
            {showReflection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showReflection && (
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your thoughts and reflections..."
              className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-orange-100 placeholder-orange-100/30 focus:border-orange-500/50 focus:outline-none"
              rows={4}
            />
          )}

          {/* Error */}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={completing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-6 py-4 font-semibold text-white transition-all hover:from-orange-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {completing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Mark Complete
              </>
            )}
          </button>
        </div>
      )}

      {/* Already Completed */}
      {step.completed && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="mt-3 font-medium text-emerald-100">Step Completed</p>
          <p className="mt-1 text-sm text-emerald-100/60">
            Great work on today&apos;s practice!
          </p>
        </div>
      )}

      {/* Safety Note */}
      {kiaan.safety_note && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-100/70">
            <span className="font-medium">Note:</span> {kiaan.safety_note}
          </p>
        </div>
      )}
    </div>
  )
}
