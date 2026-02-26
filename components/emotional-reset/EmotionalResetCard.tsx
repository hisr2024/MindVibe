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
        className={`group flex items-center justify-between rounded-2xl border border-[#d4a44c]/15 bg-black/40 px-4 py-3 text-sm font-semibold text-[#f5f0e8] transition hover:border-[#d4a44c]/30 ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">&#x1F9D8;</span>
          <span>Emotional Reset</span>
        </div>
        <span className="text-[#d4a44c]/60 transition group-hover:translate-x-0.5">&rarr;</span>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <div className={`divine-step-card rounded-2xl p-5 transition ${className}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className="divine-companion-avatar h-12 w-12 rounded-xl bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center text-2xl">
            &#x1F9D8;
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#f5f0e8]">KIAAN Emotional Reset</h3>
            <p className="text-[10px] text-[#d4a44c]/50 tracking-wide mt-0.5">7-Step Sacred Flow</p>
          </div>
        </div>
        <p className="text-sm text-[#f5f0e8]/60 mb-4 font-sacred leading-relaxed">
          Process emotions, find calm, and restore your inner peace with a sacred 7-step guided flow.
        </p>
        <Link
          href="/tools/emotional-reset"
          className="kiaan-btn-golden inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:scale-[1.02]"
        >
          Begin Sacred Reset
        </Link>
      </div>
    )
  }

  // Default variant
  return (
    <Link
      href="/tools/emotional-reset"
      className={`block divine-step-card rounded-2xl p-5 transition hover:scale-[1.02] ${className}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#c8943a]/30 to-[#e8b54a]/30 flex items-center justify-center text-xl">
          &#x1F9D8;
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#f5f0e8]">KIAAN Emotional Reset</h4>
          <p className="text-[10px] text-[#d4a44c]/50 tracking-wide">7-step sacred flow</p>
        </div>
      </div>
      <p className="text-xs text-[#f5f0e8]/55">
        Process emotions, find calm, and restore your inner peace with sacred ancient wisdom.
      </p>
    </Link>
  )
}

export default EmotionalResetCard
