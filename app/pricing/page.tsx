'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BillingToggle, PricingCard, FeatureComparison, type PricingTier } from '@/components/pricing'
import { Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useCurrency, CURRENCIES, PRICING, YEARLY_DISCOUNT, type Currency } from '@/hooks/useCurrency'

// Updated pricing tiers per requirements:
// Pro: $5, Premium: $10, Executive: $15
const createPricingTiers = (
  currency: Currency,
  formatPrice: (amount: number, options?: { showDecimals?: boolean }) => string,
  getMonthlyPrice: (tierId: string) => number,
  getYearlyPrice: (tierId: string) => number
): PricingTier[] => [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with KIAAN',
    monthlyPrice: 0,
    yearlyPrice: 0,
    kiaanQuota: 20,
    features: [
      '20 KIAAN questions/month',
      'Mood tracking',
      'Daily wisdom',
      'Basic breathing exercises',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Enhanced tools for deeper practice',
    monthlyPrice: getMonthlyPrice('pro'),
    yearlyPrice: getYearlyPrice('pro'),
    kiaanQuota: 150,
    features: [
      '150 KIAAN questions/month',
      'All Free features',
      'Journal with encryption',
      'Ardha Reframing Assistant',
      'Viyog Detachment Coach',
    ],
    cta: 'Go Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full access to all KIAAN features',
    monthlyPrice: getMonthlyPrice('premium'),
    yearlyPrice: getYearlyPrice('premium'),
    kiaanQuota: 300,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      '300 KIAAN questions/month',
      'All Pro features',
      'Relationship Compass',
      'Karma Reset Guide',
      'Priority support',
      'Advanced mood analytics',
    ],
    cta: 'Go Premium',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Unlimited access for power users',
    monthlyPrice: getMonthlyPrice('executive'),
    yearlyPrice: getYearlyPrice('executive'),
    kiaanQuota: 'unlimited',
    features: [
      'Unlimited KIAAN questions',
      'All Premium features',
      'API access',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Go Executive',
  },
]

const comparisonFeatures = [
  {
    category: 'KIAAN Chat',
    items: [
      { name: 'Monthly Questions', values: { free: '20', pro: '150', premium: '300', executive: 'Unlimited' } },
      { name: 'Response Quality', values: { free: 'Same for all', pro: 'Same for all', premium: 'Same for all', executive: 'Same for all' } },
      { name: 'Conversation History', values: { free: true, pro: true, premium: true, executive: true } },
    ],
  },
  {
    category: 'Assistants',
    items: [
      { name: 'Ardha Reframing', values: { free: false, pro: true, premium: true, executive: true } },
      { name: 'Viyog Detachment', values: { free: false, pro: true, premium: true, executive: true } },
      { name: 'Relationship Compass', values: { free: false, pro: false, premium: true, executive: true } },
      { name: 'Karma Reset Guide', values: { free: false, pro: false, premium: true, executive: true } },
    ],
  },
  {
    category: 'Features',
    items: [
      { name: 'Encrypted Journal', values: { free: false, pro: true, premium: true, executive: true } },
      { name: 'Mood Tracking', values: { free: true, pro: true, premium: true, executive: true } },
      { name: 'Daily Wisdom', values: { free: true, pro: true, premium: true, executive: true } },
      { name: 'Advanced Analytics', values: { free: false, pro: true, premium: true, executive: true } },
      { name: 'API Access', values: { free: false, pro: false, premium: false, executive: true } },
    ],
  },
  {
    category: 'Support',
    items: [
      { name: 'Community Access', values: { free: true, pro: true, premium: true, executive: true } },
      { name: 'Email Support', values: { free: false, pro: true, premium: true, executive: true } },
      { name: 'Priority Support', values: { free: false, pro: false, premium: true, executive: true } },
      { name: 'Dedicated Support', values: { free: false, pro: false, premium: false, executive: true } },
    ],
  },
]

// Currency Switcher Component
function CurrencySwitcher({
  currency,
  onCurrencyChange,
}: {
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Currency selector">
      {(Object.keys(CURRENCIES) as Currency[]).map((curr) => (
        <button
          key={curr}
          onClick={() => onCurrencyChange(curr)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            currency === curr
              ? 'bg-gradient-to-r from-orange-400 to-amber-300 text-slate-900'
              : 'bg-orange-500/10 text-orange-100/70 hover:bg-orange-500/20 hover:text-orange-50'
          }`}
          aria-pressed={currency === curr}
          aria-label={`Select ${CURRENCIES[curr].name}`}
        >
          {CURRENCIES[curr].symbol} {curr}
        </button>
      ))}
    </div>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { subscription } = useSubscription()
  const { currency, setCurrency, formatPrice, getMonthlyPrice, getYearlyPrice, isInitialized } = useCurrency()
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [centeredCardIndex, setCenteredCardIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Get pricing tiers with current currency
  const pricingTiers = createPricingTiers(currency, formatPrice, getMonthlyPrice, getYearlyPrice)

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [])

  // Scroll-related logic for detecting centered card
  const updateCenteredCard = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const cards = container.querySelectorAll('.pricing-card')
    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    let closestIndex = 0
    let closestDistance = Infinity

    cards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect()
      const cardCenter = cardRect.left + cardRect.width / 2
      const distance = Math.abs(containerCenter - cardCenter)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    setCenteredCardIndex(closestIndex)
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial check
    updateCenteredCard()

    // Listen for scroll
    container.addEventListener('scroll', updateCenteredCard, { passive: true })
    window.addEventListener('resize', updateCenteredCard, { passive: true })

    return () => {
      container.removeEventListener('scroll', updateCenteredCard)
      window.removeEventListener('resize', updateCenteredCard)
    }
  }, [updateCenteredCard])

  // Keyboard navigation for scroll container
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = 320 // Approximate card width + gap
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        container.scrollBy({ left: -cardWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
        break
      case 'ArrowRight':
        e.preventDefault()
        container.scrollBy({ left: cardWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
        break
      case 'Home':
        e.preventDefault()
        container.scrollTo({ left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
        break
      case 'End':
        e.preventDefault()
        container.scrollTo({ left: container.scrollWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
        break
    }
  }, [prefersReducedMotion])

  const handleSelectTier = async (tierId: string) => {
    if (tierId === 'free') {
      router.push('/dashboard')
      return
    }

    if (tierId === 'executive') {
      router.push('/contact')
      return
    }

    setLoading(tierId)
    
    // Simulate checkout process
    // In production, this would redirect to Stripe checkout
    setTimeout(() => {
      router.push(`/subscription/success?tier=${tierId}&yearly=${isYearly}`)
    }, 1000)
  }

  // Format prices for display
  const getFormattedPrice = (tierId: string, yearly: boolean) => {
    if (tierId === 'free') return formatPrice(0)
    const price = yearly ? getYearlyPrice(tierId) : getMonthlyPrice(tierId)
    return formatPrice(price)
  }

  const getFormattedMonthlyEquivalent = (tierId: string) => {
    if (tierId === 'free') return null
    const yearlyPrice = getYearlyPrice(tierId)
    const monthlyEquivalent = yearlyPrice / 12
    return formatPrice(monthlyEquivalent)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orange-50 mb-4">
          Choose Your Path to Inner Peace
        </h1>
        <p className="text-lg text-orange-100/70 max-w-2xl mx-auto mb-8">
          Every plan includes the same quality KIAAN guidance. Choose based on how often you&apos;d like to connect.
        </p>
        
        {/* Currency Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <CurrencySwitcher currency={currency} onCurrencyChange={setCurrency} />
        </div>
        
        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
      </div>

      {/* Scrollable Pricing Cards Container */}
      <div
        ref={scrollContainerRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Pricing plans carousel"
        className="subscription-scroll flex gap-6 overflow-x-auto pb-6 mb-16 snap-x snap-mandatory scroll-px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg"
        style={{
          scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {pricingTiers.map((tier, index) => (
          <div
            key={tier.id}
            className="flex-shrink-0 w-[280px] sm:w-[300px] snap-center"
          >
            <PricingCard
              tier={tier}
              isYearly={isYearly}
              onSelect={handleSelectTier}
              currentPlan={subscription?.tierId}
              loading={loading === tier.id}
              formattedPrice={getFormattedPrice(tier.id, isYearly)}
              formattedMonthlyEquivalent={isYearly ? getFormattedMonthlyEquivalent(tier.id) ?? undefined : undefined}
              isCentered={index === centeredCardIndex}
            />
          </div>
        ))}
      </div>

      {/* KIAAN Promise */}
      <Card variant="elevated" className="mb-16">
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500/30 via-amber-500/30 to-orange-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-orange-50 mb-2">The KIAAN Promise</h2>
              <p className="text-sm text-orange-100/70 mb-4">
                Every user receives the same quality of guidance from KIAAN—the only difference is how many questions you can ask each month. We believe mental wellness should be accessible to everyone.
              </p>
              <ul className="grid md:grid-cols-2 gap-2">
                {[
                  'Same AI quality for all tiers',
                  'No feature degradation',
                  'Your data stays private',
                  'Cancel anytime',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-orange-100/80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold text-orange-50 text-center mb-8">
          Compare Plans
        </h2>
        <Card>
          <CardContent className="overflow-x-auto">
            <FeatureComparison tiers={pricingTiers} features={comparisonFeatures} />
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-orange-50 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: 'Can I change my plan later?',
              a: 'Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing period for downgrades.',
            },
            {
              q: 'What happens when I exceed my question quota?',
              a: 'You can still use all other features like journaling, mood tracking, and breathing exercises. Your quota resets at the start of each billing period.',
            },
            {
              q: 'Is my data secure?',
              a: 'Absolutely. Your journal entries are encrypted on your device. We never sell your data and maintain strict privacy standards.',
            },
            {
              q: 'Can I get a refund?',
              a: 'We offer a 14-day money-back guarantee for all paid plans. If you&apos;re not satisfied, contact us for a full refund.',
            },
          ].map((faq, i) => (
            <Card key={i} variant="bordered">
              <CardContent>
                <h3 className="font-semibold text-orange-50 mb-2">{faq.q}</h3>
                <p className="text-sm text-orange-100/70">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
