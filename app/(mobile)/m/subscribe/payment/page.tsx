'use client'

/**
 * Mobile Payment Page — The Sacred Offering
 *
 * Order summary, trial banner, payment method selection,
 * feature highlights, secure badge, and the divine pay button.
 * Integrates with Razorpay (India) or Stripe (International).
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { PaymentSummary } from '@/components/mobile/payment/PaymentSummary'
import { TrialBanner } from '@/components/mobile/payment/TrialBanner'
import { PaymentForm } from '@/components/mobile/payment/PaymentForm'
import { SecureBadge } from '@/components/mobile/payment/SecureBadge'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { getPlanById, type PlanId, type BillingCycle } from '@/lib/payments/subscription'
import { type CurrencyCode } from '@/lib/payments/currency'
import { initiateRazorpayPayment, verifyRazorpayPayment } from '@/lib/payments/razorpay'
import { initiateStripePayment } from '@/lib/payments/stripe'

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
  const [paymentState, setPaymentState] = useState<PaymentState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Check for Stripe redirect success
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setPaymentState('success')
      triggerHaptic('success')
      setTimeout(() => router.push('/m'), 2000)
    }
    if (searchParams.get('cancelled') === 'true') {
      setErrorMessage('Payment was cancelled. You can try again when ready.')
    }
  }, [searchParams, router, triggerHaptic])

  if (!plan) {
    router.push('/m/subscribe')
    return null
  }

  const price = plan.price[currency]
  const displayPrice = billing === 'annual' ? price.annual : price.monthly
  const isINR = currency === 'INR'
  const provider = isINR ? 'razorpay' : 'stripe'

  const handlePayment = async () => {
    setPaymentState('processing')
    setErrorMessage('')
    triggerHaptic('medium')

    if (isINR) {
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
    } else {
      await initiateStripePayment({
        planId: plan.id,
        billing,
        currency,
        onFailure: (error) => {
          setPaymentState('error')
          setErrorMessage(error)
          triggerHaptic('error')
        },
      })
    }
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

      {/* Payment Method */}
      <div className="mt-6">
        <h3 className="sacred-text-divine text-base text-[var(--sacred-text-primary)] mb-3">
          Payment Method
        </h3>
        <PaymentForm currency={currency} />
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

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="sacred-text-ui text-xs text-red-400 text-center">{errorMessage}</p>
        </div>
      )}

      {/* Pay Button */}
      <div className="mt-6">
        {paymentState === 'success' ? (
          <div className="h-[52px] rounded-[28px] bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center gap-2">
            <span className="text-white text-sm">✦</span>
            <span className="sacred-text-ui text-sm text-white font-medium">
              Journey Begins — Welcome
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePayment}
            disabled={paymentState === 'processing'}
            className="sacred-btn-divine sacred-shimmer-on-tap w-full !h-[52px] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {paymentState === 'processing' ? (
              <SacredOMLoader size={24} />
            ) : plan.trialDays ? (
              'Start My Free Trial'
            ) : (
              'Complete Sacred Offering'
            )}
          </button>
        )}
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
