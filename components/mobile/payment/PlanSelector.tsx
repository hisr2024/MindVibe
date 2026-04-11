'use client'

/**
 * PlanSelector — Sacred 3-tier plan cards
 *
 * Displays Seeker (free), Bhakta (featured gold), Sadhak (teal).
 * Each card: badge, plan name + Sanskrit, tagline, trial banner, price,
 * savings note, divider, feature list (checkmark/x), CTA button, note.
 *
 * Bhakta: radial gold glow, 2px gold top border, "MOST POPULAR" badge.
 * Touch feedback: scale(0.97) 150ms on tap.
 * Accessibility: aria-pressed, role="radio" in radiogroup.
 */

import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { type Plan, type PlanId, type BillingCycle } from '@/lib/payments/subscription'
import { type CurrencyCode, formatPrice } from '@/lib/payments/currency'

interface PlanSelectorProps {
  plans: Plan[]
  selectedPlan: PlanId
  billing: BillingCycle
  currency: CurrencyCode
  onSelect: (planId: PlanId) => void
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B6355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-50">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function PlanSelector({ plans, selectedPlan, billing, currency, onSelect }: PlanSelectorProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <div className="flex flex-col gap-3" role="radiogroup" aria-label="Select a plan">
      {plans.map((plan) => {
        const isSelected = selectedPlan === plan.id
        const price = plan.price[currency] ?? { monthly: 0, annual: 0 }
        const displayPrice = billing === 'annual' ? price.annual : price.monthly
        const isFree = displayPrice === 0
        const annualTotal = price.annual * 12

        return (
          <motion.button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${plan.name} plan${plan.featured ? ', most popular' : ''}${isFree ? ', free' : `, ${formatPrice(displayPrice, currency)} per month`}`}
            onClick={() => {
              triggerHaptic('selection')
              onSelect(plan.id)
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`relative text-left rounded-[20px] overflow-hidden transition-all duration-220 ${
              plan.featured
                ? 'border-[1.5px] border-[rgba(212,160,23,0.45)]'
                : isSelected
                  ? 'border-[1.5px]'
                  : 'border border-[rgba(255,255,255,0.06)]'
            }`}
            style={{
              background: plan.featured
                ? 'radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.12), rgba(17,20,53,0.98))'
                : 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
              borderColor: !plan.featured && isSelected ? `${plan.color}70` : undefined,
              boxShadow: isSelected
                ? `0 0 24px ${plan.color}26`
                : plan.featured
                  ? '0 0 24px rgba(212,160,23,0.10)'
                  : 'none',
              borderTopWidth: plan.featured ? '2px' : undefined,
              borderTopColor: plan.featured ? '#D4A017' : undefined,
            }}
          >
            {/* Top accent bar for featured */}
            {plan.featured && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A017] to-transparent" />
            )}

            <div className="p-4 pb-4">
              {/* Badge */}
              {plan.badge && (
                <span
                  className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-lg text-[9px] font-ui font-semibold uppercase tracking-[0.08em]"
                  style={{
                    fontFamily: 'Outfit, system-ui, sans-serif',
                    backgroundColor: plan.featured ? 'rgba(212,160,23,0.2)' : 'rgba(6,182,212,0.15)',
                    color: plan.featured ? '#F0C040' : '#06B6D4',
                    border: `1px solid ${plan.featured ? 'rgba(212,160,23,0.4)' : 'rgba(6,182,212,0.3)'}`,
                  }}
                >
                  {plan.badge}
                </span>
              )}

              {/* Plan name + Sanskrit */}
              <div className="flex items-baseline gap-2 mb-0.5">
                <h3
                  className="text-[22px] font-normal italic leading-tight text-[#EDE8DC]"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  {plan.name}
                </h3>
                <span
                  className="text-[13px] font-medium leading-[2.0]"
                  style={{
                    fontFamily: '"Noto Sans Devanagari", Mangal, sans-serif',
                    color: plan.color,
                    lineHeight: 2.0,
                  }}
                >
                  {plan.sanskrit}
                </span>
              </div>

              {/* Tagline */}
              <p className="text-xs text-[#B8AE98] mb-3" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                {plan.tagline}
              </p>

              {/* Trial banner */}
              {plan.trialDays && (
                <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-[rgba(16,185,129,0.08)] border border-emerald-500/15 w-fit">
                  <span className="text-emerald-400 text-[10px]">&#10038;</span>
                  <span className="text-[11px] text-emerald-400" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                    {plan.trialDays} days free &mdash; no card charged until Day {plan.trialDays + 1}
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-1">
                {isFree ? (
                  <div>
                    <span
                      className="text-[36px] font-light leading-none text-[#EDE8DC]"
                      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                    >
                      Free
                    </span>
                    <p className="text-[13px] text-[#6B6355] mt-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                      No card required
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-[36px] font-light leading-none"
                        style={{
                          fontFamily: '"Cormorant Garamond", Georgia, serif',
                          color: '#F0C040',
                        }}
                      >
                        {formatPrice(displayPrice, currency)}
                      </span>
                      <span className="text-[13px] text-[#B8AE98]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                        /month
                      </span>
                    </div>
                    {billing === 'annual' && (
                      <p className="text-[11px] text-[#6B6355] mt-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                        Billed {formatPrice(annualTotal, currency)}/year &middot; Cancel anytime
                      </p>
                    )}
                    {billing === 'annual' && (
                      <p className="text-[11px] text-[#6B6355] line-through" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                        {formatPrice(price.monthly, currency)}/month
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(255,255,255,0.06)] my-3" />

              {/* Feature list */}
              <div className="flex flex-col gap-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 min-h-[24px]">
                    {feature.locked ? <XIcon /> : <CheckIcon />}
                    <span
                      className={`text-[14px] leading-snug ${
                        feature.locked
                          ? 'text-[#6B6355] line-through opacity-60'
                          : 'text-[#EDE8DC]'
                      }`}
                      style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-4">
                <div
                  className="h-[52px] w-full rounded-[26px] flex items-center justify-center transition-all"
                  style={{
                    background: isFree
                      ? 'rgba(107,99,85,0.15)'
                      : plan.featured
                        ? 'linear-gradient(135deg, #D4A017, #C89430)'
                        : `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)`,
                    border: isFree ? '1px solid rgba(107,99,85,0.3)' : 'none',
                  }}
                >
                  <span
                    className="text-[15px] font-medium tracking-wide"
                    style={{
                      fontFamily: 'Outfit, system-ui, sans-serif',
                      letterSpacing: '0.02em',
                      color: isFree ? '#B8AE98' : '#F8F6F0',
                    }}
                  >
                    {plan.cta} {!isFree && '\u2192'}
                  </span>
                </div>
              </div>

              {/* Note */}
              {!isFree && plan.trialDays && (
                <p
                  className="text-[11px] text-[#6B6355] text-center mt-2 leading-snug"
                  style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                >
                  Cancel before Day {plan.trialDays}, pay nothing
                </p>
              )}
              {isFree && (
                <p
                  className="text-[11px] text-[#6B6355] text-center mt-2 leading-snug"
                  style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                >
                  Free forever &middot; No card required
                </p>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default PlanSelector
