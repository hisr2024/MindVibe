'use client'

/**
 * Mobile Plan Selection Page — The Sankalpa
 *
 * Three-tier plan cards (Seeker, Sacred Pro, Sacred Circle)
 * with monthly/annual billing toggle, currency auto-detection,
 * 30-day guarantee, and FAQ accordion.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { PlanSelector } from '@/components/mobile/payment/PlanSelector'
import { BillingToggle } from '@/components/mobile/payment/BillingToggle'
import { PLANS, type PlanId, type BillingCycle } from '@/lib/payments/subscription'
import { detectCurrency, CURRENCIES, type CurrencyCode } from '@/lib/payments/currency'

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, absolutely. Cancel your subscription anytime from Settings. No questions asked, no hidden fees. Your access continues until the end of the billing period.',
  },
  {
    q: 'What happens after the free trial?',
    a: "After 7 days, you'll be charged the selected plan amount. We'll remind you 2 days before the trial ends so there are no surprises.",
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can upgrade or downgrade at any time. When upgrading, the change is immediate. When downgrading, it takes effect at the end of your current billing period.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your spiritual journey data is encrypted with AES-256-GCM encryption. We never share, sell, or use your personal reflections for any purpose other than serving your journey.',
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro')
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    setCurrency(detectCurrency())
  }, [])

  const handleContinue = () => {
    if (selectedPlan === 'seeker') {
      router.push('/m')
      return
    }
    router.push(`/m/subscribe/payment?plan=${selectedPlan}&billing=${billing}&currency=${currency}`)
  }

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan)

  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] px-5 pb-10 overflow-y-auto">
      <AuthHeader
        title="Choose Your Path"
        subtitle="Select the journey that calls to you"
      />

      {/* Billing Toggle */}
      <BillingToggle billing={billing} onToggle={setBilling} />

      {/* Currency selector */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setCurrency(code)}
            className={`px-2.5 py-1 rounded-lg text-xs sacred-text-ui transition-all ${
              currency === code
                ? 'bg-[rgba(212,160,23,0.15)] text-[var(--sacred-divine-gold-bright)] border border-[rgba(212,160,23,0.3)]'
                : 'text-[var(--sacred-text-muted)] border border-transparent'
            }`}
          >
            {CURRENCIES[code].symbol}
          </button>
        ))}
      </div>

      {/* Plan Cards */}
      <PlanSelector
        plans={PLANS}
        selectedPlan={selectedPlan}
        billing={billing}
        currency={currency}
        onSelect={setSelectedPlan}
      />

      {/* CTA Button */}
      <div className="mt-6">
        <button
          type="button"
          onClick={handleContinue}
          className="sacred-btn-divine sacred-shimmer-on-tap w-full"
        >
          {selectedPlanData?.cta || 'Continue'}
        </button>
      </div>

      {/* 30-Day Guarantee */}
      <div className="flex items-start gap-3 mt-8 p-4 rounded-[16px] bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.06)]">
        <div className="w-10 h-10 rounded-full bg-[rgba(16,185,129,0.12)] border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h3 className="sacred-text-divine text-sm text-[var(--sacred-text-primary)] mb-0.5">
            Sacred Guarantee
          </h3>
          <p className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)] leading-relaxed">
            Full refund within 30 days if KIAAN doesn&apos;t serve your journey. No questions asked.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 mb-4">
        <h3 className="sacred-text-divine text-base text-[var(--sacred-text-primary)] mb-4 text-center">
          Common Questions
        </h3>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl transition-all ${
                openFaq === i
                  ? 'border border-[rgba(212,160,23,0.2)] bg-[rgba(22,26,66,0.5)]'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex items-center justify-between w-full px-4 py-3 text-left"
              >
                <span className="sacred-text-ui text-sm text-[var(--sacred-text-primary)] pr-4">
                  {item.q}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-[var(--sacred-text-muted)] flex-shrink-0 transition-transform duration-300 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)] leading-relaxed">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
