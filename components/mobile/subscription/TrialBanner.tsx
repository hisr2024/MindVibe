'use client'

export function TrialBanner({ days = 7 }: { days?: number }) {
  return (
    <div className="rounded-xl px-4 py-3 border border-emerald-400/30 bg-emerald-500/10 flex items-center gap-2">
      <span className="text-emerald-300">✓</span>
      <p className="text-sm text-emerald-100">
        {days}-day free trial · Cancel anytime
      </p>
    </div>
  )
}
