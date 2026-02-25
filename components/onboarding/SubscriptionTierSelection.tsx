/**
 * SubscriptionTierSelection Component
 * Display subscription tiers with feature comparison
 */

'use client'

import { motion } from 'framer-motion'
import type { SubscriptionTier, SubscriptionTierId, BillingCycle } from '@/types/onboarding.types'

interface SubscriptionTierSelectionProps {
  tiers: SubscriptionTier[]
  selectedTier: SubscriptionTierId
  billingCycle: BillingCycle
  onSelectTier: (tierId: SubscriptionTierId) => void
  onBillingCycleChange: (cycle: BillingCycle) => void
  className?: string
}

export function SubscriptionTierSelection({
  tiers,
  selectedTier,
  billingCycle,
  onSelectTier,
  onBillingCycleChange,
  className = '',
}: SubscriptionTierSelectionProps) {
  const getPrice = (tier: SubscriptionTier) => {
    return billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice
  }

  const getMonthlyEquivalent = (tier: SubscriptionTier) => {
    if (billingCycle === 'yearly' && tier.yearlyPrice > 0) {
      return Math.round(tier.yearlyPrice / 12)
    }
    return tier.monthlyPrice
  }

  const getSavings = (tier: SubscriptionTier) => {
    if (billingCycle === 'yearly' && tier.monthlyPrice > 0) {
      const yearlyTotal = tier.monthlyPrice * 12
      const savings = yearlyTotal - tier.yearlyPrice
      return savings > 0 ? Math.round((savings / yearlyTotal) * 100) : 0
    }
    return 0
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span
          className={`text-sm ${
            billingCycle === 'monthly' ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/60'
          }`}
        >
          Monthly
        </span>
        <button
          onClick={() =>
            onBillingCycleChange(billingCycle === 'monthly' ? 'yearly' : 'monthly')
          }
          className="relative w-14 h-7 rounded-full bg-[#d4a44c]/20 border border-[#d4a44c]/30 transition"
        >
          <motion.div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#e8b54a]"
            animate={{ left: billingCycle === 'yearly' ? '1.75rem' : '0.125rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
        <span
          className={`text-sm flex items-center gap-2 ${
            billingCycle === 'yearly' ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/60'
          }`}
        >
          Yearly
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
            2 months free
          </span>
        </span>
      </div>

      {/* Tiers grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id
          const price = getPrice(tier)
          const monthlyEquiv = getMonthlyEquivalent(tier)
          const savings = getSavings(tier)

          return (
            <motion.button
              key={tier.id}
              onClick={() => onSelectTier(tier.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? 'border-[#d4a44c] bg-[#d4a44c]/10 ring-2 ring-[#d4a44c]/50'
                  : tier.isPopular
                  ? 'border-[#d4a44c]/50 bg-[#1a0f08]/50'
                  : 'border-[#d4a44c]/20 bg-black/30 hover:border-[#d4a44c]/50'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <span className="absolute -top-2 left-4 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] px-2 py-0.5 text-[10px] font-bold text-slate-900">
                  {tier.badge}
                </span>
              )}

              {/* Header */}
              <h3 className="text-lg font-semibold text-[#f5f0e8] mb-1">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold text-[#f5f0e8]">
                  ${price === 0 ? '0' : price}
                </span>
                <span className="text-xs text-[#f5f0e8]/60">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              {billingCycle === 'yearly' && monthlyEquiv > 0 && (
                <div className="text-[11px] text-[#f5f0e8]/70 mb-1">
                  ~${monthlyEquiv}/month when billed yearly
                </div>
              )}

              {/* Yearly savings badge */}
              {billingCycle === 'yearly' && savings > 0 && (
                <span className="inline-block mb-2 text-xs text-emerald-400">
                  Save {savings}% yearly
                </span>
              )}

              {/* Description */}
              <p className="text-xs text-[#f5f0e8]/70 mb-3">{tier.description}</p>

              {/* KIAAN quota */}
              <div className="text-xs text-[#f5f0e8]/60 mb-3 pb-3 border-b border-[#d4a44c]/10">
                KIAAN:{' '}
                {tier.kiaanQuota === 'unlimited'
                  ? 'Unlimited'
                  : `${tier.kiaanQuota}/month`}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {tier.features.slice(0, 5).map((feature, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-2 text-xs ${
                      feature.included ? 'text-[#f5f0e8]/70' : 'text-[#f5f0e8]/30'
                    }`}
                  >
                    {feature.included ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3 text-[#f5f0e8]/30 mt-0.5 shrink-0"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    <span>
                      {feature.name}
                      {feature.limit && (
                        <span className="text-[#f5f0e8]/40"> ({feature.limit})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="tier-selected"
                  className="absolute inset-0 rounded-2xl ring-2 ring-[#d4a44c] pointer-events-none"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Note */}
      <p className="text-center text-xs text-[#f5f0e8]/50 mt-6">
        You can upgrade or change your plan anytime. All paid plans include a 15-day free trial.
      </p>
    </div>
  )
}

export default SubscriptionTierSelection
