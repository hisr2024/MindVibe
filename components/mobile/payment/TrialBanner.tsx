'use client'

/**
 * TrialBanner — "7 days free" messaging with sacred styling
 *
 * Green-tinted banner communicating the trial offer.
 * Shows below the order summary on the payment page.
 */

interface TrialBannerProps {
  days?: number
}

export function TrialBanner({ days = 7 }: TrialBannerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[rgba(16,185,129,0.08)] border border-emerald-500/15">
      <span className="text-emerald-400 text-sm">✦</span>
      <p className="sacred-text-ui text-xs text-emerald-400">
        {days}-day free trial · Cancel anytime · No charge today
      </p>
    </div>
  )
}

export default TrialBanner
