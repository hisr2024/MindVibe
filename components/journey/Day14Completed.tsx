'use client'

/**
 * Day 14 completed screen — shown when a journey finishes.
 *
 * Displays a grounded "Practice continues" message with two action links:
 * 1. "Handle today's trigger" → Viyoga tool (default)
 * 2. "Daily micro-practice"  → Ardha tool (secondary)
 *
 * No celebratory visuals. Tone: quiet continuation, not achievement.
 */

import Link from 'next/link'

export interface Day14CompletedProps {
  className?: string
}

export function Day14Completed({ className = '' }: Day14CompletedProps) {
  return (
    <div
      data-testid="day14-completed"
      className={`rounded-xl border border-white/10 bg-white/5 p-8 text-center ${className}`}
    >
      <p className="text-sm text-white/40 uppercase tracking-widest mb-3">
        Day 14
      </p>

      <h2
        data-testid="day14-title"
        className="text-lg font-medium text-white mb-2"
      >
        Practice continues
      </h2>

      <p
        data-testid="day14-body"
        className="text-white/50 mb-6 leading-relaxed max-w-md mx-auto"
      >
        The 14 days are a beginning, not an end. Carry what you have practised
        into everyday moments — the work deepens from here.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/tools/viyog"
          data-testid="day14-link-trigger"
          className="inline-block rounded-xl bg-white/10 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        >
          Handle today&apos;s trigger
        </Link>

        <Link
          href="/tools/ardha"
          data-testid="day14-link-practice"
          className="inline-block rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
        >
          Daily micro-practice
        </Link>
      </div>
    </div>
  )
}
