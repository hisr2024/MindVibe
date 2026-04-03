'use client'

/**
 * BillingToggle — Monthly/Annual toggle with "Save 40%" pill
 *
 * Custom styled toggle, gold thumb when annual selected.
 * Pill badge appears next to Annual label showing savings.
 */

import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface BillingToggleProps {
  billing: 'monthly' | 'annual'
  onToggle: (billing: 'monthly' | 'annual') => void
}

export function BillingToggle({ billing, onToggle }: BillingToggleProps) {
  const { triggerHaptic } = useHapticFeedback()
  const isAnnual = billing === 'annual'

  const handleToggle = () => {
    triggerHaptic('selection')
    onToggle(isAnnual ? 'monthly' : 'annual')
  }

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className={`sacred-text-ui text-sm transition-colors ${
        !isAnnual ? 'text-[var(--sacred-text-primary)]' : 'text-[var(--sacred-text-muted)]'
      }`}>
        Monthly
      </span>

      {/* Custom toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={isAnnual}
        onClick={handleToggle}
        className={`relative w-[46px] h-[26px] rounded-full transition-all duration-300 ${
          isAnnual
            ? 'bg-gradient-to-r from-[var(--sacred-krishna-blue)] to-[var(--sacred-peacock-teal)]'
            : 'bg-[rgba(22,26,66,0.8)] border border-[rgba(255,255,255,0.15)]'
        }`}
      >
        <div
          className={`absolute top-[3px] w-5 h-5 rounded-full transition-all duration-300 shadow-md ${
            isAnnual
              ? 'left-[23px] bg-[var(--sacred-divine-gold)]'
              : 'left-[3px] bg-[var(--sacred-text-secondary)]'
          }`}
        />
      </button>

      <span className={`sacred-text-ui text-sm transition-colors ${
        isAnnual ? 'text-[var(--sacred-text-primary)]' : 'text-[var(--sacred-text-muted)]'
      }`}>
        Annual
      </span>

      {/* Save badge */}
      <span className={`text-[10px] sacred-text-ui font-semibold px-2 py-0.5 rounded-full transition-all duration-300 ${
        isAnnual
          ? 'bg-[rgba(16,185,129,0.2)] text-emerald-400 border border-emerald-500/20'
          : 'bg-[rgba(16,185,129,0.1)] text-emerald-500/50 border border-emerald-500/10'
      }`}>
        Save 40%
      </span>
    </div>
  )
}

export default BillingToggle
