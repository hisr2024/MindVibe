'use client'

/**
 * PlanSelector — 3-tier plan cards with sacred styling
 *
 * Displays Seeker (free), Sacred Pro (featured), Sacred Circle.
 * Features are listed with green dots or dimmed locked indicators.
 * Sacred Pro has a 2px gold border and "MOST POPULAR" badge.
 */

import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { type Plan, type PlanId } from '@/lib/payments/subscription'
import { type CurrencyCode, formatPrice } from '@/lib/payments/currency'

interface PlanSelectorProps {
  plans: Plan[]
  selectedPlan: PlanId
  billing: 'monthly' | 'annual'
  currency: CurrencyCode
  onSelect: (planId: PlanId) => void
}

export function PlanSelector({ plans, selectedPlan, billing, currency, onSelect }: PlanSelectorProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <div className="flex flex-col gap-4">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.id
        const price = plan.price[currency]
        const displayPrice = billing === 'annual' ? price.annual : price.monthly
        const isFree = displayPrice === 0

        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => {
              triggerHaptic('selection')
              onSelect(plan.id)
            }}
            className={`relative text-left rounded-[20px] p-5 transition-all duration-300 ${
              plan.featured
                ? 'border-2 border-[rgba(212,160,23,0.5)] bg-gradient-to-br from-[rgba(27,79,187,0.18)] to-[rgba(17,20,53,0.99)] scale-[1.01]'
                : isSelected
                  ? `border-2 bg-[var(--sacred-gradient-card)]`
                  : 'border border-[rgba(255,255,255,0.08)] bg-[var(--sacred-gradient-card)]'
            }`}
            style={!plan.featured && isSelected ? { borderColor: `${plan.color}80` } : undefined}
          >
            {/* Badge */}
            {plan.badge && (
              <span
                className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-[10px] sacred-text-ui font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: plan.featured ? 'rgba(212,160,23,0.2)' : 'rgba(6,182,212,0.15)',
                  color: plan.featured ? '#F0C040' : '#06B6D4',
                  border: `1px solid ${plan.featured ? 'rgba(212,160,23,0.4)' : 'rgba(6,182,212,0.3)'}`,
                }}
              >
                {plan.badge}
              </span>
            )}

            {/* Plan header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="sacred-text-divine text-lg text-[var(--sacred-text-primary)]">
                    {plan.name}
                  </h3>
                  <span className="sacred-text-scripture text-sm text-[var(--sacred-text-muted)]">
                    {plan.sanskrit}
                  </span>
                </div>
                <p className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)] mt-0.5">
                  {plan.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="text-right">
                {isFree ? (
                  <span className="sacred-text-divine text-xl text-[var(--sacred-text-primary)]">Free</span>
                ) : (
                  <>
                    <span className="sacred-text-divine text-xl" style={{ color: plan.color }}>
                      {formatPrice(displayPrice, currency)}
                    </span>
                    <span className="sacred-text-ui text-xs text-[var(--sacred-text-muted)]">/mo</span>
                    {billing === 'annual' && (
                      <p className="sacred-text-ui text-[10px] text-[var(--sacred-text-muted)] mt-0.5">
                        Billed {formatPrice(displayPrice * 12, currency)}/year
                      </p>
                    )}
                    {billing === 'annual' && (
                      <p className="sacred-text-ui text-[10px] text-[var(--sacred-text-muted)] line-through">
                        {formatPrice(plan.price[currency].monthly, currency)}/mo
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Trial badge */}
            {plan.trialDays && (
              <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-lg bg-[rgba(16,185,129,0.1)] border border-emerald-500/15 w-fit">
                <span className="text-emerald-400 text-[10px]">✦</span>
                <span className="sacred-text-ui text-[11px] text-emerald-400">
                  {plan.trialDays}-day free trial
                </span>
              </div>
            )}

            {/* Features */}
            <div className="flex flex-col gap-1.5 mt-2">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      feature.locked ? 'bg-[var(--sacred-text-muted)] opacity-40' : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`sacred-text-ui text-xs ${
                      feature.locked
                        ? 'text-[var(--sacred-text-muted)] line-through opacity-50'
                        : 'text-[var(--sacred-text-secondary)]'
                    }`}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Selection indicator */}
            <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'border-[var(--sacred-divine-gold)] bg-[var(--sacred-divine-gold)]'
                : 'border-[rgba(255,255,255,0.2)]'
            }`}>
              {isSelected && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default PlanSelector
