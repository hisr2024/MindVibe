'use client'

import { type PricingTier } from '@/components/pricing/PricingCard'

interface PlanSelectionStepProps {
  tiers: PricingTier[]
  selectedTier: string
  onSelectTier: (tierId: string) => void
}

export function PlanSelectionStep({
  tiers,
  selectedTier,
  onSelectTier,
}: PlanSelectionStepProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-orange-100/70 text-center mb-6">
        Choose a plan to get started. You can upgrade anytime.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.slice(0, 3).map((tier) => {
          const isSelected = selectedTier === tier.id
          return (
            <button
              key={tier.id}
              onClick={() => onSelectTier(tier.id)}
              className={`relative flex flex-col rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? 'border-orange-400 bg-orange-500/10 ring-2 ring-orange-400/50'
                  : tier.highlighted
                  ? 'border-orange-400/50 bg-[#1a0f08]/50'
                  : 'border-orange-500/20 bg-black/30 hover:border-orange-400/50'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-2 left-4 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 px-2 py-0.5 text-[10px] font-bold text-slate-900">
                  {tier.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold text-orange-50 mb-1">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-orange-50">${tier.monthlyPrice}</span>
                <span className="text-xs text-orange-100/60">/month</span>
              </div>
              <p className="text-xs text-orange-100/70 mb-3">{tier.description}</p>
              <div className="text-xs text-orange-100/60 mb-2">
                KIAAN: {tier.kiaanQuota === 'unlimited' ? 'Unlimited' : `${tier.kiaanQuota}/month`}
              </div>
              <ul className="space-y-1 flex-1">
                {tier.features.slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-orange-100/70">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PlanSelectionStep
