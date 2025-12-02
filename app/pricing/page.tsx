'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BillingToggle, PricingCard, FeatureComparison, type PricingTier } from '@/components/pricing'
import { Card, CardContent } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'

const pricingTiers: PricingTier[] = [
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
    id: 'basic',
    name: 'Basic',
    description: 'For regular mental wellness practice',
    monthlyPrice: 2.49,
    yearlyPrice: 24.99,
    kiaanQuota: 50,
    features: [
      '50 KIAAN questions/month',
      'All Free features',
      'Journal with encryption',
      'Extended journal insights',
      'Email support',
    ],
    cta: 'Start Basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Enhanced tools for deeper practice',
    monthlyPrice: 7.49,
    yearlyPrice: 74.99,
    kiaanQuota: 150,
    features: [
      '150 KIAAN questions/month',
      'All Basic features',
      'Ardha Reframing Assistant',
      'Viyog Detachment Coach',
      'Advanced mood analytics',
    ],
    cta: 'Go Pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full access to all KIAAN features',
    monthlyPrice: 15,
    yearlyPrice: 149.99,
    kiaanQuota: 300,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      '300 KIAAN questions/month',
      'All Pro features',
      'Relationship Compass',
      'Karma Reset Guide',
      'Priority support',
      'Custom breathing patterns',
    ],
    cta: 'Go Premium',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Unlimited access for power users',
    monthlyPrice: 20,
    yearlyPrice: 199.99,
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
      { name: 'Monthly Questions', values: { free: '20', basic: '50', pro: '150', premium: '300', executive: 'Unlimited' } },
      { name: 'Response Quality', values: { free: 'Same for all', basic: 'Same for all', pro: 'Same for all', premium: 'Same for all', executive: 'Same for all' } },
      { name: 'Conversation History', values: { free: true, basic: true, pro: true, premium: true, executive: true } },
    ],
  },
  {
    category: 'Assistants',
    items: [
      { name: 'Ardha Reframing', values: { free: false, basic: false, pro: true, premium: true, executive: true } },
      { name: 'Viyog Detachment', values: { free: false, basic: false, pro: true, premium: true, executive: true } },
      { name: 'Relationship Compass', values: { free: false, basic: false, pro: false, premium: true, executive: true } },
      { name: 'Karma Reset Guide', values: { free: false, basic: false, pro: false, premium: true, executive: true } },
    ],
  },
  {
    category: 'Features',
    items: [
      { name: 'Encrypted Journal', values: { free: false, basic: true, pro: true, premium: true, executive: true } },
      { name: 'Mood Tracking', values: { free: true, basic: true, pro: true, premium: true, executive: true } },
      { name: 'Daily Wisdom', values: { free: true, basic: true, pro: true, premium: true, executive: true } },
      { name: 'Advanced Analytics', values: { free: false, basic: false, pro: true, premium: true, executive: true } },
      { name: 'API Access', values: { free: false, basic: false, pro: false, premium: false, executive: true } },
    ],
  },
  {
    category: 'Support',
    items: [
      { name: 'Community Access', values: { free: true, basic: true, pro: true, premium: true, executive: true } },
      { name: 'Email Support', values: { free: false, basic: true, pro: true, premium: true, executive: true } },
      { name: 'Priority Support', values: { free: false, basic: false, pro: false, premium: true, executive: true } },
      { name: 'Dedicated Support', values: { free: false, basic: false, pro: false, premium: false, executive: true } },
    ],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { subscription } = useSubscription()
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orange-50 mb-4">
          Choose Your Path to Inner Peace
        </h1>
        <p className="text-lg text-orange-100/70 max-w-2xl mx-auto mb-8">
          Every plan includes the same quality KIAAN guidance. Choose based on how often you'd like to connect.
        </p>
        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
        {pricingTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            isYearly={isYearly}
            onSelect={handleSelectTier}
            currentPlan={subscription?.tierId}
            loading={loading === tier.id}
          />
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
              a: "We offer a 14-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
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
