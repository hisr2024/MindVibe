'use client'

import { useState } from 'react'
import type { JourneyRecommendation } from '@/types/wisdomJourney.types'

interface JourneyRecommendationsProps {
  recommendations: JourneyRecommendation[]
  onSelect: (template: string, title: string) => void
  loading?: boolean
}

/**
 * JourneyRecommendations component displays AI-powered journey suggestions.
 *
 * Features:
 * - 3 recommendation cards with scores and reasons
 * - Gradient backgrounds matching recommendation score
 * - "Start This Journey" call-to-action
 * - Loading state with skeleton
 */
export function JourneyRecommendations({
  recommendations,
  onSelect,
  loading = false,
}: JourneyRecommendationsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
    if (score >= 0.6) return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
    return 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
  }

  const getScoreBadgeColor = (score: number): string => {
    if (score >= 0.8) return 'bg-emerald-500/20 text-emerald-300'
    if (score >= 0.6) return 'bg-blue-500/20 text-blue-300'
    return 'bg-purple-500/20 text-purple-300'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-orange-50">Recommended Wisdom Journeys</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6"
            >
              <div className="h-4 w-3/4 rounded bg-white/10"></div>
              <div className="mt-3 h-3 w-full rounded bg-white/5"></div>
              <div className="mt-2 h-3 w-5/6 rounded bg-white/5"></div>
              <div className="mt-4 h-10 rounded-lg bg-white/5"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 text-center">
        <p className="text-orange-100/70">No recommendations available at this time.</p>
        <p className="mt-2 text-sm text-orange-100/50">
          Start tracking your mood and journaling to receive personalized suggestions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-orange-50">Recommended Wisdom Journeys</h2>
        <p className="mt-1 text-sm text-orange-100/70">
          AI-powered journey recommendations based on your mood patterns and journal themes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {recommendations.map((rec, index) => (
          <div
            key={rec.template}
            className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-all duration-200 hover:scale-[1.02] hover:border-white/20 ${getScoreColor(rec.score)}`}
          >
            {/* Recommendation Badge */}
            {index === 0 && (
              <div className="absolute right-4 top-4">
                <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Top Pick
                </span>
              </div>
            )}

            {/* Score Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${getScoreBadgeColor(rec.score)}`}
              >
                {Math.round(rec.score * 100)}% Match
              </span>
            </div>

            {/* Title */}
            <h3 className="mt-3 text-lg font-semibold text-orange-50">{rec.title}</h3>

            {/* Description */}
            <p className="mt-2 text-sm text-orange-100/70 line-clamp-3">{rec.description}</p>

            {/* Reason */}
            <div className="mt-3 rounded-lg bg-black/20 p-3">
              <p className="text-xs text-orange-100/60">
                <span className="font-semibold text-orange-200">Why this journey: </span>
                {rec.reason}
              </p>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                setSelectedTemplate(rec.template)
                onSelect(rec.template, rec.title)
              }}
              disabled={selectedTemplate === rec.template}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:from-orange-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedTemplate === rec.template ? 'Starting Journey...' : 'Start This Journey'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-orange-100/50">
        💡 Tip: You can pause or restart journeys at any time
      </p>
    </div>
  )
}
