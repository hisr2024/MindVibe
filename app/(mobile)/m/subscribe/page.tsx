'use client'

/**
 * Mobile Plan Selection Page — Choose Your Path
 *
 * Screen 1 of the subscription flow:
 * Header (H1 + Sanskrit + subtitle + trust line) ->
 * Billing toggle (pill, radiogroup) ->
 * Currency selector (auto-detect, manual override) ->
 * Three plan cards (Seeker, Bhakta featured, Sadhak) ->
 * CTA button ->
 * Sacred Guarantee (30-day, shield icon) ->
 * FAQ accordion (5 questions) ->
 * Legal footer (terms, privacy, auto-renew)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PlanSelector } from '@/components/mobile/payment/PlanSelector'
import { BillingToggle } from '@/components/mobile/payment/BillingToggle'
import { PLANS, type PlanId, type BillingCycle } from '@/lib/payments/subscription'
import { detectCurrency, CURRENCIES, type CurrencyCode } from '@/lib/payments/currency'

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Settings at any time. You keep access until the end of your paid period. No questions asked, no cancellation fees, no guilt.',
  },
  {
    q: 'How does the free trial work?',
    a: "Your 7-day trial begins today. You won't be charged until Day 8. Cancel any time before then and you pay absolutely nothing.",
  },
  {
    q: 'Which payment methods are accepted?',
    a: 'Apple Pay, Google Pay, all major cards (Visa, Mastercard, Amex, RuPay International), SEPA Direct Debit for EU accounts. All payments processed securely by Stripe.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade or downgrade from Settings at any time. Upgrades take effect immediately. Downgrades apply at your next billing date.',
  },
  {
    q: 'Is my payment secure?',
    a: 'All payments are processed by Stripe (PCI DSS Level 1 certified \u2014 the same standard as major banks). We never store your card details. All connections are SSL encrypted.',
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro')
  const [billing, setBilling] = useState<BillingCycle>('annual')
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    if (typeof window === 'undefined') return 'USD'
    return detectCurrency()
  })
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleContinue = () => {
    if (selectedPlan === 'seeker') {
      router.push('/m')
      return
    }
    router.push(`/m/subscribe/payment?plan=${selectedPlan}&billing=${billing}&currency=${currency}`)
  }

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan)

  return (
    <div className="min-h-screen bg-[#050714] overflow-y-auto">
      <div className="max-w-[430px] mx-auto px-[14px] pb-12">
        {/* Header */}
        <header className="flex flex-col items-center pt-14 pb-2">
          {/* OM circle */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[rgba(22,26,66,0.9)] to-[rgba(17,20,53,0.95)] border border-[rgba(212,160,23,0.4)] mb-5 animate-sacred-breath">
            <span
              className="text-3xl text-[#D4A017] select-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              &#x0950;
            </span>
          </div>

          <h1
            className="text-[28px] font-light text-[#EDE8DC] tracking-wide text-center leading-tight"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Choose Your Path
          </h1>
          <p
            className="text-[15px] text-[#D4A017] mt-1 text-center"
            style={{ fontFamily: '"Noto Sans Devanagari", Mangal, sans-serif', lineHeight: 2.0 }}
          >
            &#x092E;&#x093E;&#x0930;&#x094D;&#x0917; &#x091A;&#x0941;&#x0928;&#x0947;&#x0902;
          </p>
          <p
            className="text-[14px] text-[#B8AE98] mt-2 text-center"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            Select the offering that serves your dharmic journey
          </p>

          {/* Trust line */}
          <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
            <span className="text-[11px] text-[#6B6355]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              Trusted by seekers in 40+ countries
            </span>
            <span className="text-[11px] text-[#6B6355]">&middot;</span>
            <span className="text-[11px] text-[#6B6355]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              7-day free trial
            </span>
            <span className="text-[11px] text-[#6B6355]">&middot;</span>
            <span className="text-[11px] text-[#6B6355]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              Cancel anytime
            </span>
          </div>
        </header>

        {/* Billing Toggle */}
        <BillingToggle billing={billing} onToggle={setBilling} />

        {/* Currency Selector */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setCurrency(code)}
              aria-label={`Select ${code} currency`}
              aria-pressed={currency === code}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all min-w-[44px] min-h-[36px] ${
                currency === code
                  ? 'bg-[rgba(212,160,23,0.15)] text-[#F0C040] border border-[rgba(212,160,23,0.3)]'
                  : 'text-[#6B6355] border border-transparent hover:text-[#B8AE98]'
              }`}
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {CURRENCIES[code].symbol} {code}
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

        {/* Primary CTA */}
        <div className="mt-6">
          <motion.button
            type="button"
            onClick={handleContinue}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-full h-[52px] rounded-[26px] flex items-center justify-center text-[15px] font-medium tracking-wide"
            style={{
              fontFamily: 'Outfit, system-ui, sans-serif',
              letterSpacing: '0.02em',
              color: '#F8F6F0',
              background: selectedPlan === 'seeker'
                ? 'rgba(107,99,85,0.25)'
                : selectedPlanData?.color === '#06B6D4'
                  ? 'linear-gradient(135deg, #06B6D4, #0891B2)'
                  : 'linear-gradient(135deg, #D4A017, #C89430)',
            }}
          >
            {selectedPlanData?.cta || 'Continue'} {selectedPlan !== 'seeker' && '\u2192'}
          </motion.button>
        </div>

        {/* Sacred Guarantee */}
        <div className="flex items-start gap-3 mt-8 p-4 rounded-[16px] bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.06)]">
          <div className="w-10 h-10 rounded-full bg-[rgba(16,185,129,0.12)] border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-0.5">
              <h3
                className="text-[14px] text-[#EDE8DC] font-normal"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                The Sacred Guarantee
              </h3>
              <span
                className="text-[11px] text-[#D4A017]"
                style={{ fontFamily: '"Noto Sans Devanagari", Mangal, sans-serif', lineHeight: 1.5 }}
              >
                &#x0936;&#x094D;&#x0930;&#x0926;&#x094D;&#x0927;&#x093E; &#x0917;&#x093E;&#x0930;&#x0902;&#x091F;&#x0940;
              </span>
            </div>
            <p className="text-[12px] text-[#B8AE98] leading-relaxed" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              If Kiaanverse does not deepen your connection to the Gita within 30 days,
              we will refund every rupee, euro, or dollar. No questions. No guilt.
            </p>
            <span
              className="inline-block mt-2 px-2 py-0.5 rounded-md bg-[rgba(16,185,129,0.1)] border border-emerald-500/15 text-[10px] text-emerald-400"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              30-day full refund
            </span>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 mb-6">
          <h3
            className="text-[18px] text-[#EDE8DC] mb-4 text-center"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Common Questions
          </h3>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`rounded-xl transition-all duration-200 ${
                  openFaq === i
                    ? 'border border-[rgba(212,160,23,0.15)] bg-[rgba(22,26,66,0.5)]'
                    : 'border border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  className="flex items-center justify-between w-full px-4 py-3 text-left min-h-[44px]"
                >
                  <span className="text-[14px] text-[#EDE8DC] pr-4" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
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
                    className={`text-[#6B6355] flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3">
                        <p className="text-[13px] text-[#B8AE98] leading-relaxed" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                          {item.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Footer */}
        <footer className="text-center pb-8 pt-2">
          <p className="text-[11px] text-[#6B6355] leading-snug" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            By continuing, you agree to the{' '}
            <a href="/terms" className="underline underline-offset-2 hover:text-[#B8AE98] transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="underline underline-offset-2 hover:text-[#B8AE98] transition-colors">
              Privacy Policy
            </a>.
            <br />
            Subscriptions auto-renew. Cancel anytime in Settings.
            <br />
            Billed by Kiaanverse GmbH via Stripe.
          </p>
        </footer>
      </div>
    </div>
  )
}
