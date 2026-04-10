'use client'

/**
 * Mobile Payment Page — Sacred Offering
 *
 * Screen 2 of the subscription flow:
 * Back button -> "Sacred Offering" header -> Order summary card ->
 * Trial banner -> Express Checkout (Apple/Google Pay) ->
 * "or pay by card" divider -> Stripe PaymentElement ->
 * Error messages (aria-live) -> CTA button ->
 * Feature highlights -> Secure badge -> Legal note.
 *
 * Payment architecture:
 * ALL currencies route through Stripe Elements embedded checkout.
 * - EUR/USD/GBP: Card, PayPal, SEPA (EUR), Link, Google Pay, Apple Pay
 * - INR: Card, UPI, Link, Google Pay, Apple Pay
 *
 * Google Pay and Apple Pay are handled by the PaymentRequestButton
 * (ExpressCheckout component) rendered above the PaymentElement.
 * They work on Chrome (Google Pay) and Safari (Apple Pay) when the
 * user has saved payment methods in their wallet.
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { PaymentSummary } from '@/components/mobile/payment/PaymentSummary'
import { TrialBanner } from '@/components/mobile/payment/TrialBanner'
import { SecureBadge } from '@/components/mobile/payment/SecureBadge'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { StripePaymentWrapper } from '@/components/payment/StripePaymentForm'
import { getPlanById, type PlanId, type BillingCycle } from '@/lib/payments/subscription'
import { type CurrencyCode } from '@/lib/payments/currency'

type PaymentState = 'idle' | 'processing' | 'verifying' | 'success' | 'error'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { triggerHaptic } = useHapticFeedback()

  const VALID_PLANS: PlanId[] = ['seeker', 'pro', 'circle']
  const VALID_BILLING: BillingCycle[] = ['monthly', 'annual']
  const VALID_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP']

  const rawPlan = searchParams.get('plan') || 'pro'
  const rawBilling = searchParams.get('billing') || 'annual'
  const rawCurrency = searchParams.get('currency') || 'EUR'

  const planId: PlanId = VALID_PLANS.includes(rawPlan as PlanId) ? rawPlan as PlanId : 'pro'
  const billing: BillingCycle = VALID_BILLING.includes(rawBilling as BillingCycle) ? rawBilling as BillingCycle : 'annual'
  const currency: CurrencyCode = VALID_CURRENCIES.includes(rawCurrency as CurrencyCode) ? rawCurrency as CurrencyCode : 'EUR'

  const plan = getPlanById(planId)
  const isRedirectSuccess = searchParams.get('success') === 'true'
  const isRedirectCancelled = searchParams.get('cancelled') === 'true'
  const [paymentState, setPaymentState] = useState<PaymentState>(isRedirectSuccess ? 'success' : 'idle')
  const [errorMessage, setErrorMessage] = useState(isRedirectCancelled ? 'Payment was cancelled. You can try again when ready.' : '')

  // Handle Stripe redirect success
  useEffect(() => {
    if (isRedirectSuccess) {
      triggerHaptic('success')
      const timer = setTimeout(() => router.push('/m/subscribe/success?plan=' + planId), 2000)
      return () => clearTimeout(timer)
    }
  }, [isRedirectSuccess, router, triggerHaptic, planId])

  if (!plan) {
    router.push('/m/subscribe')
    return null
  }

  const price = plan.price[currency]
  const displayPrice = billing === 'annual' ? price.annual : price.monthly

  // Calculate first charge date (7 days from now)
  const firstChargeDate = new Date()
  firstChargeDate.setDate(firstChargeDate.getDate() + (plan.trialDays || 0))
  const formattedChargeDate = firstChargeDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const handleStripeSuccess = () => {
    setPaymentState('success')
    triggerHaptic('success')
    setTimeout(() => router.push('/m/subscribe/success?plan=' + planId), 2000)
  }

  const handleStripeError = (msg: string) => {
    setPaymentState('error')
    setErrorMessage(msg)
    triggerHaptic('error')
  }

  const FEATURES_HIGHLIGHT = [
    'Unlimited Sakha conversations',
    'All 6 Shadripu Journeys',
    'KIAAN Voice Companion',
    'Karma & Emotional Reset',
  ]

  const loadingMessages: Record<PaymentState, string> = {
    idle: '',
    processing: 'Processing your offering\u2026',
    verifying: 'Verifying with your bank\u2026',
    success: 'Almost there\u2026',
    error: '',
  }

  return (
    <div className="min-h-screen bg-[#050714]">
      <div className="max-w-[430px] mx-auto px-[14px] pb-12">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 pt-14 pb-4 text-[#6B6355] text-[14px] min-h-[44px]"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h1
            className="text-[22px] font-light text-[#EDE8DC] tracking-wide"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Sacred Offering
          </h1>
          <p className="text-[12px] text-[#6B6355] mt-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Secure payment &middot; Powered by Stripe
          </p>
        </div>

        {/* Order Summary */}
        <PaymentSummary
          planName={plan.name}
          billing={billing}
          price={displayPrice}
          currency={currency}
          trialDays={plan.trialDays}
        />

        {/* First charge date */}
        {plan.trialDays && (
          <p className="text-[11px] text-[#6B6355] text-center mt-2" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            First charge: {formattedChargeDate}
          </p>
        )}

        {/* Trial Banner */}
        {plan.trialDays && (
          <div className="mt-3">
            <TrialBanner days={plan.trialDays} />
          </div>
        )}

        {/* Payment Section */}
        <div className="mt-6">
          <h3
            className="text-[16px] text-[#EDE8DC] mb-3"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Payment Method
          </h3>

          {paymentState === 'success' ? (
            /* Success State */
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-[52px] rounded-[26px] bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center gap-2"
              role="status"
              aria-live="polite"
            >
              <span className="text-white text-sm">&#10038;</span>
              <span className="text-[14px] text-white font-medium" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                Journey Begins &mdash; Welcome
              </span>
            </motion.div>
          ) : (paymentState === 'processing' || paymentState === 'verifying') ? (
            /* Processing State */
            <div
              className="flex flex-col items-center gap-3 py-6"
              role="status"
              aria-busy="true"
              aria-label={loadingMessages[paymentState]}
            >
              <SacredOMLoader size={36} />
              <p className="text-[13px] text-[#B8AE98] italic" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                {loadingMessages[paymentState]}
              </p>
            </div>
          ) : (
            /* Stripe Elements for ALL currencies (Cards, UPI, SEPA, PayPal, Google Pay, Apple Pay) */
            <>
              <StripePaymentWrapper
                planId={planId}
                billing={billing}
                currency={currency}
                planLabel={`Kiaanverse ${plan.name}`}
                planPrice={displayPrice}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
              />

              {/* Error Message */}
              {errorMessage && (
                <div
                  className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-[12px] text-[#FCA5A5] text-center" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                    {errorMessage}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 p-4 rounded-[16px] bg-[rgba(22,26,66,0.4)] border border-[rgba(255,255,255,0.05)]">
          <div className="space-y-2.5">
            {FEATURES_HIGHLIGHT.map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[13px] text-[#B8AE98]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Secure Badge */}
        <SecureBadge provider="stripe" />

        {/* Cancel note */}
        <p className="text-[11px] text-[#6B6355] text-center mt-2 leading-snug" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
          Cancel any time &middot; 30-day guarantee
        </p>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050714] flex items-center justify-center">
        <SacredOMLoader size={48} message="Preparing your offering..." />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
