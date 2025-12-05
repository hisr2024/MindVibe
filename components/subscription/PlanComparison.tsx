'use client'

import { Button, Badge } from '@/components/ui'

interface PlanTier {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  kiaanQuota: number | string
  highlighted?: boolean
}

interface PlanComparisonProps {
  currentPlanId: string
  isYearly: boolean
  onToggleBilling: (yearly: boolean) => void
  onSelectPlan: (planId: string) => void
  className?: string
}

const plans: PlanTier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    kiaanQuota: 20,
    features: ['20 KIAAN questions/month', 'Mood tracking', 'Daily wisdom', 'Basic breathing'],
  },
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    kiaanQuota: 75,
    features: ['75 KIAAN questions/month', 'All Free features', 'Guided breathing', 'Mood journaling'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    kiaanQuota: 150,
    features: ['150 KIAAN questions/month', 'All Basic features', 'Encrypted journal', 'Ardha & Viyog'],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 999,
    yearlyPrice: 9990,
    kiaanQuota: 300,
    features: ['300 KIAAN questions/month', 'All Pro features', 'Relationship Compass', 'Karma Reset'],
    highlighted: true,
  },
  {
    id: 'executive',
    name: 'Executive',
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    kiaanQuota: 'Unlimited',
    features: ['Unlimited KIAAN', 'All Premium features', 'API access', 'Dedicated support'],
  },
]

export function PlanComparison({
  currentPlanId,
  isYearly,
  onToggleBilling,
  onSelectPlan,
  className = '',
}: PlanComparisonProps) {
  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free'
    return `$${(cents / 100).toFixed(2)}`
  }

  const yearlySavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12
    const savings = monthlyTotal - yearlyPrice
    return Math.round((savings / monthlyTotal) * 100)
  }

  return (
    <div className={`rounded-2xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-orange-50">Compare Plans</h2>
          <p className="text-xs text-orange-100/60">Choose the plan that works for you</p>
        </div>
        
        {/* Billing Toggle */}
        <div className="flex items-center gap-3 bg-black/30 rounded-xl p-1">
          <button
            onClick={() => onToggleBilling(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              !isYearly
                ? 'bg-orange-500/20 text-orange-50'
                : 'text-orange-100/60 hover:text-orange-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onToggleBilling(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              isYearly
                ? 'bg-orange-500/20 text-orange-50'
                : 'text-orange-100/60 hover:text-orange-50'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-emerald-400">(Save up to 17%)</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
          const savings = yearlySavings(plan.monthlyPrice, plan.yearlyPrice)

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl p-4 ${
                plan.highlighted
                  ? 'border-2 border-orange-400 bg-orange-500/10'
                  : 'border border-orange-500/15 bg-black/30'
              } ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`}
            >
              {plan.highlighted && (
                <Badge
                  variant="premium"
                  size="sm"
                  className="absolute -top-2 left-1/2 -translate-x-1/2"
                >
                  Popular
                </Badge>
              )}
              
              {isCurrent && (
                <Badge
                  variant="success"
                  size="sm"
                  className="absolute -top-2 right-2"
                >
                  Current
                </Badge>
              )}

              <h3 className="text-lg font-semibold text-orange-50 mt-2">{plan.name}</h3>
              
              <div className="my-3">
                <span className="text-2xl font-bold text-orange-50">{formatPrice(price)}</span>
                {price > 0 && (
                  <span className="text-xs text-orange-100/60">
                    /{isYearly ? 'year' : 'month'}
                  </span>
                )}
              </div>

              {isYearly && price > 0 && savings > 0 && (
                <p className="text-xs text-emerald-400 mb-3">Save {savings}% vs monthly</p>
              )}

              <p className="text-sm text-orange-100/70 mb-3">
                {typeof plan.kiaanQuota === 'number'
                  ? `${plan.kiaanQuota} questions/mo`
                  : plan.kiaanQuota}
              </p>

              <ul className="space-y-1 mb-4">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="text-xs text-orange-100/60 flex items-start gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? 'ghost' : plan.highlighted ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={() => !isCurrent && onSelectPlan(plan.id)}
                disabled={isCurrent}
              >
                {isCurrent ? 'Current Plan' : 'Select'}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlanComparison
