'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BillingToggle, PricingCard, FeatureComparison, type PricingTier } from '@/components/pricing'
import { Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useCurrency, CURRENCIES, type Currency } from '@/hooks/useCurrency'

// Pricing tiers aligned with backend SubscriptionTier enum:
// FREE, BASIC (Plus), PREMIUM (Pro), ENTERPRISE (Elite), PREMIER
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
    kiaanQuota: 15,
    features: [
      '15 KIAAN questions/month',
      'Mood tracking',
      'Daily wisdom',
      'Basic breathing exercises',
      '1 trial Wisdom Journey',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'basic',
    name: 'Plus',
    description: 'Build a steady practice with guided support',
    monthlyPrice: getMonthlyPrice('basic'),
    yearlyPrice: getYearlyPrice('basic'),
    kiaanQuota: 150,
    features: [
      '150 KIAAN questions/month',
      'All Free features',
      'Journal with encryption',
      'Voice synthesis',
      '3 Wisdom Journeys',
      'Ardha Cognitive Reframing',
      'Viyoga Detachment Coach',
    ],
    cta: 'Start 15-day free trial',
    trialAvailable: true,
  },
  {
    id: 'premium',
    name: 'Pro',
    description: '300 KIAAN questions with all features unlocked',
    monthlyPrice: getMonthlyPrice('premium'),
    yearlyPrice: getYearlyPrice('premium'),
    kiaanQuota: 300,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      '300 KIAAN questions/month',
      'All Plus features',
      'Voice Companion',
      'Soul Reading & Quantum Dive',
      'KIAAN Agent',
      'Relationship Compass',
      '10 Wisdom Journeys',
      'Advanced mood analytics',
      'Priority support & offline access',
    ],
    cta: 'Start 15-day free trial',
    trialAvailable: true,
  },
  {
    id: 'enterprise',
    name: 'Elite',
    description: '800 KIAAN questions with unlimited Wisdom Journeys',
    monthlyPrice: getMonthlyPrice('enterprise'),
    yearlyPrice: getYearlyPrice('enterprise'),
    kiaanQuota: 800,
    features: [
      '800 KIAAN questions/month',
      'All Pro features',
      'Unlimited Wisdom Journeys',
      'Dedicated support',
    ],
    cta: 'Start 15-day free trial',
    trialAvailable: true,
  },
  {
    id: 'premier',
    name: 'Premier',
    description: 'Unlimited KIAAN with unlimited access to everything',
    monthlyPrice: getMonthlyPrice('premier'),
    yearlyPrice: getYearlyPrice('premier'),
    kiaanQuota: 'unlimited',
    badge: 'Best Value',
    features: [
      'Unlimited KIAAN questions',
      'All Elite features',
      'Unlimited everything',
      'Dedicated support',
    ],
    cta: 'Start 15-day free trial',
    trialAvailable: true,
  },
]

const comparisonFeatures = [
  {
    category: 'KIAAN Chat',
    items: [
      { name: 'Monthly Questions', values: { free: '15', basic: '150', premium: '300', enterprise: '800', premier: 'Unlimited' } },
      { name: 'Response Quality', values: { free: 'Same for all', basic: 'Same for all', premium: 'Same for all', enterprise: 'Same for all', premier: 'Same for all' } },
      { name: 'Conversation History', values: { free: true, basic: true, premium: true, enterprise: true, premier: true } },
    ],
  },
  {
    category: 'Assistants',
    items: [
      { name: 'Ardha Reframing', values: { free: false, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Viyoga Detachment', values: { free: false, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Relationship Compass', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
      { name: 'Emotional Reset Guide', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
    ],
  },
  {
    category: 'KIAAN Ecosystem',
    items: [
      { name: 'Divine Chat', values: { free: true, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Friend Mode', values: { free: true, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Voice Synthesis', values: { free: false, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Voice Companion', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
      { name: 'Soul Reading', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
      { name: 'Quantum Dive', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
      { name: 'KIAAN Agent', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
    ],
  },
  {
    category: 'Features',
    items: [
      { name: 'Encrypted Journal', values: { free: false, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Mood Tracking', values: { free: true, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Daily Wisdom', values: { free: true, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Advanced Analytics', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
      { name: 'Unlimited Journeys', values: { free: false, basic: false, premium: false, enterprise: true, premier: true } },
    ],
  },
  {
    category: 'Support',
    items: [
      { name: 'Community Access', values: { free: true, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Email Support', values: { free: false, basic: true, premium: true, enterprise: true, premier: true } },
      { name: 'Priority Support', values: { free: false, basic: false, premium: true, enterprise: true, premier: true } },
      { name: 'Dedicated Support', values: { free: false, basic: false, premium: false, enterprise: true, premier: true } },
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
  const currencies: Currency[] = ['USD', 'EUR', 'INR']
  const scrollerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Partial<Record<Currency, HTMLButtonElement | null>>>({})

  useEffect(() => {
    const activeButton = buttonRefs.current[currency]
    activeButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currency])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = currencies.indexOf(currency)
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = (currentIndex + 1) % currencies.length
      onCurrencyChange(currencies[next])
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prev = (currentIndex - 1 + currencies.length) % currencies.length
      onCurrencyChange(currencies[prev])
    }
  }

  return (
    <div className="w-full max-w-xl" aria-label="Currency selector">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto no-scrollbar rounded-2xl bg-orange-500/10 p-2 shadow-inner"
        role="tablist"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {currencies.map((curr) => (
          <button
            key={curr}
            ref={(el) => {
              buttonRefs.current[curr] = el
            }}
            role="tab"
            aria-selected={currency === curr}
            onClick={() => onCurrencyChange(curr)}
            className={`flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              currency === curr
                ? 'bg-gradient-to-r from-orange-400 via-amber-300 to-orange-200 text-slate-900 shadow-lg shadow-orange-500/30'
                : 'bg-orange-500/10 text-orange-100/80 hover:bg-orange-500/20'
            }`}
          >
            <span className="text-base">{CURRENCIES[curr].symbol}</span>
            <span>{curr}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-orange-100/70">Scroll or tap to choose your currency.</p>
    </div>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { subscription } = useSubscription()
  const { currency, setCurrency, formatPrice, getMonthlyPrice, getYearlyPrice } = useCurrency()
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [centeredCardIndex, setCenteredCardIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollRafRef = useRef<number>()
  const scrollFadeTimeoutRef = useRef<NodeJS.Timeout>()
  const snapTimeoutRef = useRef<NodeJS.Timeout>()
  const isDraggingRef = useRef(false)
  const lastDragXRef = useRef(0)
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

  const snapToClosestCard = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.pricing-card'))
    if (!cards.length) return

    const containerCenter = container.scrollLeft + container.clientWidth / 2

    let closestIndex = 0
    let closestDistance = Number.POSITIVE_INFINITY

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2
      const distance = Math.abs(containerCenter - cardCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    const targetCard = cards[closestIndex]
    const targetCenter = targetCard.offsetLeft + targetCard.clientWidth / 2
    const targetScrollLeft = targetCenter - container.clientWidth / 2

    container.scrollTo({
      left: targetScrollLeft,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [prefersReducedMotion])

  const handleActiveScroll = useCallback(() => {
    setIsScrolling(true)
    if (scrollFadeTimeoutRef.current) clearTimeout(scrollFadeTimeoutRef.current)
    scrollFadeTimeoutRef.current = setTimeout(() => setIsScrolling(false), 900)

    if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)
    snapTimeoutRef.current = setTimeout(() => snapToClosestCard(), 180)
  }, [snapToClosestCard])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial check
    updateCenteredCard()

    // Listen for scroll
    const onScroll = () => {
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = requestAnimationFrame(() => {
        updateCenteredCard()
        handleActiveScroll()
      })
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateCenteredCard, { passive: true })

    return () => {
      container.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateCenteredCard)
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current)
      if (scrollFadeTimeoutRef.current) clearTimeout(scrollFadeTimeoutRef.current)
    }
  }, [handleActiveScroll, updateCenteredCard])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault()
        container.scrollBy({ left: event.deltaY, behavior: 'auto' })
      }

      handleActiveScroll()
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      isDraggingRef.current = true
      lastDragXRef.current = event.clientX
      container.setPointerCapture(event.pointerId)
      container.style.scrollBehavior = 'auto'
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return
      event.preventDefault()
      const deltaX = event.clientX - lastDragXRef.current
      container.scrollLeft -= deltaX
      lastDragXRef.current = event.clientX
      handleActiveScroll()
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId)
      }
      container.style.scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth'
      snapToClosestCard()
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('pointerleave', handlePointerUp)
    container.addEventListener('pointercancel', handlePointerUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('pointerleave', handlePointerUp)
      container.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [handleActiveScroll, prefersReducedMotion, snapToClosestCard])

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

    setLoading(tierId)

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan_tier: tierId,
          billing_period: isYearly ? 'yearly' : 'monthly',
          success_url: `${window.location.origin}/subscription/success?tier=${tierId}&yearly=${isYearly}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.detail || error.message || 'Failed to start checkout')
      }

      const data = await response.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(null)
    }
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
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orange-50 mb-4">
          Choose Your Path to Inner Peace
        </h1>
        <p className="text-lg text-orange-100/70 max-w-2xl mx-auto mb-8">
          Every plan includes the same quality KIAAN guidance. Choose based on how often you&apos;d like to connect.
        </p>
        
        {/* Currency Switcher + Billing Toggle */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full">
            <CurrencySwitcher currency={currency} onCurrencyChange={setCurrency} />
            <div className="w-full lg:w-auto">
              <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
            </div>
          </div>
          <p className="text-sm text-orange-100/70">
            INR pricing is always 25% less than USD/EUR. Save with yearly billing — get 2 months free.
          </p>
        </div>
      </div>

      {/* Scrollable Pricing Cards Container */}
      <div
        ref={scrollContainerRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Pricing plans carousel"
        className={`subscription-scroll grid gap-6 pb-6 mb-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 ${
          isScrolling ? 'scrolling' : ''
        }`}
        style={{
          scrollBehavior: prefersReducedMotion ? 'auto' : 'smooth',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overflowX: 'auto',
        }}
      >
        {pricingTiers.map((tier, index) => (
          <div
            key={tier.id}
            className="flex-shrink-0 w-full snap-center sm:snap-auto sm:w-full"
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
