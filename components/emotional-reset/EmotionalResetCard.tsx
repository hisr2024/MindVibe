'use client'

import Link from 'next/link'

interface EmotionalResetCardProps {
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

/**
 * Reusable card component for Emotional Reset
 * Used in dashboard and features pages
 */
export function EmotionalResetCard({
  variant = 'default',
  className = '',
}: EmotionalResetCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        href="/tools/emotional-reset"
        className={`group flex items-center justify-between rounded-2xl border border-orange-500/20 bg-black/40 px-4 py-3 text-sm font-semibold text-orange-50 transition hover:border-orange-400/50 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🕉️</span>
          <span>Emotional Reset</span>
        </div>
        <span className="text-orange-200/90 transition group-hover:translate-x-0.5">→</span>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <div className={`rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#0d0d10] to-[#0c0f14] p-5 shadow-[0_10px_40px_rgba(255,115,39,0.1)] hover:border-orange-400/40 transition ${className}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400/30 to-amber-300/30 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/10">
            🕉️
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-50">KIAAN Emotional Reset</h3>
            <p className="text-xs text-orange-100/70 mt-0.5">7-Step Guided Flow</p>
          </div>
        </div>
        <p className="text-sm text-orange-100/80 mb-4">
          Process emotions, find calm, and reset your mental state with ancient wisdom in a guided 7-step flow.
        </p>
        <Link
          href="/tools/emotional-reset"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400/80 via-[#ffb347]/80 to-orange-300/80 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.02]"
        >
          <span>🧘</span>
          Start Emotional Reset
        </Link>
      </div>
    )
  }

  // Default variant
  return (
    <Link
      href="/tools/emotional-reset"
      className={`block rounded-2xl border border-orange-500/20 bg-black/50 p-5 shadow-[0_12px_48px_rgba(255,115,39,0.12)] transition hover:border-orange-300/70 hover:scale-[1.02] ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400/30 to-amber-300/30 flex items-center justify-center text-xl">
          🕉️
        </div>
        <div>
          <h4 className="text-sm font-semibold text-orange-50">KIAAN Emotional Reset</h4>
          <p className="text-xs text-orange-100/70">7-step guided flow</p>
        </div>
      </div>
      <p className="text-xs text-orange-100/80">
        Process emotions, find calm, and reset your mental state with ancient wisdom.
      </p>
    </Link>
  )
}

export default EmotionalResetCard
