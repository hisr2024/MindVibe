'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui'

export interface PricingTier {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  highlighted?: boolean
  badge?: string
  cta: string
  kiaanQuota: number | 'unlimited'
}

interface PricingCardProps {
  tier: PricingTier
  isYearly: boolean
  onSelect: (tierId: string) => void
  currentPlan?: string
  loading?: boolean
  /** Formatted price string (e.g., "$5.00" or "€4.60") */
  formattedPrice?: string
  /** Formatted monthly equivalent for yearly billing */
  formattedMonthlyEquivalent?: string
  /** Whether this card is centered/in view (for scale animation) */
  isCentered?: boolean
}

export function PricingCard({
  tier,
  isYearly,
  onSelect,
  currentPlan,
  loading,
  formattedPrice,
  formattedMonthlyEquivalent,
  isCentered = false,
}: PricingCardProps) {
  const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice
  const isCurrentPlan = currentPlan === tier.id
  const cardRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Display price - use formatted if provided, otherwise fallback to raw
  const displayPrice = formattedPrice || `$${price}`
  const displayMonthlyEquivalent = formattedMonthlyEquivalent

  // Scale animation for centered card (respects prefers-reduced-motion)
  const scaleClass = isCentered && !prefersReducedMotion ? 'scale-[1.03]' : ''

  return (
    <div
      ref={cardRef}
      className={`pricing-card relative flex flex-col rounded-3xl border p-6 transition-all duration-300 ease-out ${scaleClass} ${
        tier.highlighted
          ? 'border-orange-400/50 bg-gradient-to-br from-[#1a0f08] via-[#0b0b0f] to-[#0c0814] shadow-[0_20px_80px_rgba(255,115,39,0.25)] scale-[1.02]'
          : 'border-orange-500/15 bg-[#0d0d10]/85 hover:border-orange-500/30'
      }`}
      tabIndex={0}
      role="article"
      aria-label={`${tier.name} plan: ${displayPrice} per ${isYearly ? 'year' : 'month'}`}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-1 text-xs font-bold text-slate-900">
            {tier.badge}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-orange-50">{tier.name}</h3>
        <p className="mt-1 text-sm text-orange-100/70">{tier.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-orange-50">
            {displayPrice}
          </span>
          <span className="text-orange-100/60">
            /{isYearly ? 'year' : 'month'}
          </span>
        </div>
        {isYearly && tier.monthlyPrice > 0 && displayMonthlyEquivalent && (
          <p className="mt-1 text-xs text-orange-100/50">
            {displayMonthlyEquivalent}/month when billed yearly
          </p>
        )}
      </div>

      <div className="mb-6 rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
        <div className="flex items-center gap-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="font-medium text-orange-50">KIAAN Questions</span>
        </div>
        <p className="mt-1 text-lg font-bold text-orange-400">
          {tier.kiaanQuota === 'unlimited' ? 'Unlimited' : `${tier.kiaanQuota}/month`}
        </p>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-orange-100/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-400 mt-0.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier.id)}
        disabled={isCurrentPlan || loading}
        loading={loading}
        variant={tier.highlighted ? 'primary' : 'secondary'}
        size="lg"
        className="w-full"
      >
        {isCurrentPlan ? 'Current Plan' : tier.cta}
      </Button>
    </div>
  )
}

export default PricingCard
