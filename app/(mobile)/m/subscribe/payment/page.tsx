'use client'

/**
 * Mobile Payment Page — The Sacred Offering
 *
 * Order summary, trial banner, payment method selection,
 * feature highlights, secure badge, and the divine pay button.
 *
 * Payment architecture:
 * - Non-INR (EUR/USD/GBP): Stripe Elements embedded checkout with
 *   PaymentRequestButton (Apple/Google Pay) + PaymentElement (cards, SEPA, Link)
 * - INR: Razorpay SDK for UPI + cards (primary), with Stripe fallback
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { PaymentSummary } from '@/components/mobile/payment/PaymentSummary'
import { TrialBanner } from '@/components/mobile/payment/TrialBanner'
import { SecureBadge } from '@/components/mobile/payment/SecureBadge'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { StripePaymentWrapper } from '@/components/payment/StripePaymentForm'
import { getPlanById, type PlanId, type BillingCycle } from '@/lib/payments/subscription'
import { type CurrencyCode } from '@/lib/payments/currency'
import { initiateRazorpayPayment, verifyRazorpayPayment } from '@/lib/payments/razorpay'

type PaymentState = 'idle' | 'processing' | 'success' | 'error'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { triggerHaptic } = useHapticFeedback()

  const VALID_PLANS: PlanId[] = ['seeker', 'pro', 'circle']
  const VALID_BILLING: BillingCycle[] = ['monthly', 'annual']
  const VALID_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP']

  const rawPlan = searchParams.get('plan') || 'pro'
  const rawBilling = searchParams.get('billing') || 'annual'
  const rawCurrency = searchParams.get('currency') || 'INR'

  const planId: PlanId = VALID_PLANS.includes(rawPlan as PlanId) ? rawPlan as PlanId : 'pro'
  const billing: BillingCycle = VALID_BILLING.includes(rawBilling as BillingCycle) ? rawBilling as BillingCycle : 'annual'
  const currency: CurrencyCode = VALID_CURRENCIES.includes(rawCurrency as CurrencyCode) ? rawCurrency as CurrencyCode : 'INR'

  const plan = getPlanById(planId)
  const isRedirectSuccess = searchParams.get('success') === 'true'
  const isRedirectCancelled = searchParams.get('cancelled') === 'true'
  const [paymentState, setPaymentState] = useState<PaymentState>(isRedirectSuccess ? 'success' : 'idle')
  const [errorMessage, setErrorMessage] = useState(isRedirectCancelled ? 'Payment was cancelled. You can try again when ready.' : '')

  // Handle Stripe redirect success — navigate home after delay
  useEffect(() => {
    if (isRedirectSuccess) {
      triggerHaptic('success')
      const timer = setTimeout(() => router.push('/m'), 2000)
      return () => clearTimeout(timer)
    }
  }, [isRedirectSuccess, router, triggerHaptic])

  if (!plan) {
    router.push('/m/subscribe')
    return null
  }

  const price = plan.price[currency]
  const displayPrice = billing === 'annual' ? price.annual : price.monthly
  const isINR = currency === 'INR'
  const provider = isINR ? 'razorpay' : 'stripe'

  const handleRazorpayPayment = async () => {
    setPaymentState('processing')
    setErrorMessage('')
    triggerHaptic('medium')

    await initiateRazorpayPayment({
      planId: plan.id,
      billing,
      planName: plan.name,
      onSuccess: async (response) => {
        const verified = await verifyRazorpayPayment(response)
        if (verified) {
          setPaymentState('success')
          triggerHaptic('success')
          setTimeout(() => router.push('/m'), 2000)
        } else {
          setPaymentState('error')
          setErrorMessage('Payment verification failed. Please contact support.')
          triggerHaptic('error')
        }
      },
      onFailure: (error) => {
        setPaymentState('error')
        setErrorMessage(error)
        triggerHaptic('error')
      },
      onDismiss: () => {
        setPaymentState('idle')
      },
    })
  }

  const handleStripeSuccess = () => {
    setPaymentState('success')
    triggerHaptic('success')
    setTimeout(() => router.push('/m'), 2000)
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

  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] px-5 pb-10">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 pt-14 pb-4 text-[var(--sacred-text-muted)] sacred-text-ui text-sm"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {/* Order Summary */}
      <PaymentSummary
        planName={plan.name}
        billing={billing}
        price={displayPrice}
        currency={currency}
        trialDays={plan.trialDays}
      />

      {/* Trial Banner */}
      {plan.trialDays && (
        <div className="mt-3">
          <TrialBanner days={plan.trialDays} />
        </div>
      )}

      {/* Payment Section */}
      <div className="mt-6">
        <h3 className="sacred-text-divine text-base text-[var(--sacred-text-primary)] mb-3">
          Payment Method
        </h3>

        {paymentState === 'success' ? (
          /* Success State */
          <div className="h-[52px] rounded-[28px] bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center gap-2">
            <span className="text-white text-sm">✦</span>
            <span className="sacred-text-ui text-sm text-white font-medium">
              Journey Begins — Welcome
            </span>
          </div>
        ) : isINR ? (
          /* INR: Razorpay SDK (UPI, cards, wallets) */
          <>
            <div className="p-4 rounded-[16px] bg-[var(--sacred-gradient-card)] border border-[rgba(212,160,23,0.12)]">
              <p className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)] mb-3">
                Pay securely with UPI, cards, or wallets via Razorpay
              </p>
              <div className="flex items-center gap-2 mb-3">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <span key={app} className="px-2 py-1 rounded-lg bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.08)] sacred-text-ui text-[10px] text-[var(--sacred-text-muted)]">
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="sacred-text-ui text-xs text-red-400 text-center">{errorMessage}</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={paymentState === 'processing'}
              className="sacred-btn-divine sacred-shimmer-on-tap w-full !h-[52px] flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {paymentState === 'processing' ? (
                <SacredOMLoader size={24} />
              ) : plan.trialDays ? (
                'Start My Free Trial'
              ) : (
                'Complete Sacred Offering'
              )}
            </button>
          </>
        ) : (
          /* Non-INR: Stripe Elements (Apple Pay, Google Pay, Cards, SEPA, Link) */
          <>
            <StripePaymentWrapper
              planId={planId}
              billing={billing}
              currency={currency}
              planLabel={`Kiaanverse ${plan.name}`}
              onSuccess={handleStripeSuccess}
              onError={handleStripeError}
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="sacred-text-ui text-xs text-red-400 text-center">{errorMessage}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Feature Highlights */}
      <div className="mt-6 p-4 rounded-[16px] bg-[rgba(22,26,66,0.4)] border border-[rgba(255,255,255,0.05)]">
        <div className="space-y-2">
          {FEATURES_HIGHLIGHT.map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)]">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Secure Badge */}
      <SecureBadge provider={provider} />
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--sacred-cosmic-void)] flex items-center justify-center">
        <SacredOMLoader size={48} message="Preparing your offering..." />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
