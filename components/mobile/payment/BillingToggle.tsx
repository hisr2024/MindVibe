'use client'

/**
 * BillingToggle — Pill toggle for Monthly/Annual billing
 *
 * Centered pill with two options. Active pill has gold tint + border.
 * "Save 40%" gold badge on Annual option.
 * ARIA: role="radiogroup" with role="radio" options.
 * Touch target: 44px height minimum.
 */

import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface BillingToggleProps {
  billing: 'monthly' | 'annual'
  onToggle: (billing: 'monthly' | 'annual') => void
}

export function BillingToggle({ billing, onToggle }: BillingToggleProps) {
  const { triggerHaptic } = useHapticFeedback()
  const isAnnual = billing === 'annual'

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div
        role="radiogroup"
        aria-label="Billing frequency"
        className="inline-flex items-center h-[44px] rounded-full bg-[rgba(22,26,66,0.6)] border border-[rgba(255,255,255,0.08)] p-[3px]"
      >
        {/* Monthly option */}
        <button
          type="button"
          role="radio"
          aria-checked={!isAnnual}
          onClick={() => {
            triggerHaptic('selection')
            onToggle('monthly')
          }}
          className={`relative h-[38px] px-5 rounded-full text-[14px] font-medium transition-all duration-200 ${
            !isAnnual
              ? 'bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.4)] text-[#D4A017]'
              : 'text-[#6B6355] border border-transparent hover:text-[#B8AE98]'
          }`}
          style={{ fontFamily: 'Outfit, system-ui, sans-serif', minWidth: '90px' }}
        >
          Monthly
        </button>

        {/* Annual option */}
        <button
          type="button"
          role="radio"
          aria-checked={isAnnual}
          onClick={() => {
            triggerHaptic('selection')
            onToggle('annual')
          }}
          className={`relative h-[38px] px-5 rounded-full text-[14px] font-medium transition-all duration-200 flex items-center gap-2 ${
            isAnnual
              ? 'bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.4)] text-[#D4A017]'
              : 'text-[#6B6355] border border-transparent hover:text-[#B8AE98]'
          }`}
          style={{ fontFamily: 'Outfit, system-ui, sans-serif', minWidth: '90px' }}
        >
          Annual
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-all ${
              isAnnual
                ? 'bg-[rgba(212,160,23,0.2)] text-[#F0C040] border border-[rgba(212,160,23,0.3)]'
                : 'bg-[rgba(212,160,23,0.08)] text-[#6B6355] border border-[rgba(212,160,23,0.1)]'
            }`}
          >
            Save 40%
          </span>
        </button>
      </div>

      {isAnnual && (
        <p className="text-[11px] text-[#6B6355]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          Billed annually &middot; Cancel anytime
        </p>
      )}
    </div>
  )
}

export default BillingToggle
