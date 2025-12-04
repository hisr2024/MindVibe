'use client'

import type { SessionSummary as SessionSummaryType } from '@/types/emotional-reset.types'

interface SessionSummaryProps {
  summary: SessionSummaryType
  onClose?: () => void
  className?: string
}

/**
 * Session Summary Component
 * Displays the final step summary with insights and journal prompt
 */
export function SessionSummary({
  summary,
  onClose,
  className = '',
}: SessionSummaryProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Completion Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg shadow-orange-500/30">
          <span className="text-3xl">🌟</span>
        </div>
        <h3 className="text-xl font-semibold text-orange-50">
          Session Complete
        </h3>
        <p className="text-sm text-orange-100/70">
          You&apos;ve taken a meaningful step toward emotional balance
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-300/10 p-5 space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-orange-100/80">
          Session Summary
        </h4>
        <p className="leading-relaxed text-orange-50">
          {summary.summary}
        </p>
      </div>

      {/* Key Insight */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h4 className="text-sm font-semibold text-blue-300">
            Key Insight
          </h4>
        </div>
        <p className="leading-relaxed text-orange-50">
          {summary.key_insight}
        </p>
      </div>

      {/* Affirmation to Remember */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-orange-400/15 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h4 className="text-sm font-semibold text-amber-300">
            Affirmation to Remember
          </h4>
        </div>
        <p className="text-lg font-medium italic text-orange-50">
          &ldquo;{summary.affirmation_to_remember}&rdquo;
        </p>
      </div>

      {/* Next Steps */}
      <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-5 space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-orange-100/80">
          Next Steps
        </h4>
        <ul className="space-y-2">
          {summary.next_steps.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-orange-100/90"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-semibold text-orange-300">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Closing Message */}
      <div className="rounded-xl border-t border-orange-500/20 pt-4 text-center">
        <p className="text-orange-100/80 italic">
          {summary.closing_message}
        </p>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-orange-400 to-amber-300 px-6 py-3 font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Return to Dashboard
        </button>
      )}
    </div>
  )
}

export default SessionSummary
