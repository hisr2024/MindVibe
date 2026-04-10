'use client'

/**
 * StripePaymentForm — Embedded payment form with Stripe Elements
 *
 * Architecture:
 * 1. StripePaymentWrapper (outer) — fetches client_secret, provides Elements context
 * 2. StripePaymentInner (inner) — renders ExpressCheckout + PaymentElement + submit
 *
 * Payment methods shown automatically by Stripe based on currency:
 * - INR: Card, UPI, Link
 * - EUR: Card, SEPA Direct Debit, PayPal, Link
 * - USD/GBP: Card, PayPal, Link
 * - Apple Pay / Google Pay: via ExpressCheckout (PaymentRequestButton)
 *
 * Intent types:
 * - Trial subscriptions → SetupIntent (collects payment method for future charges)
 * - Non-trial subscriptions → PaymentIntent (charges immediately)
 * The backend returns intent_type ('setup' | 'payment') to guide confirmation.
 */

import { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/client'
import { STRIPE_APPEARANCE } from '@/lib/stripe/appearance'
import { apiFetch } from '@/lib/api'
import { ExpressCheckout } from './ExpressCheckout'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { translateStripeError } from '@/lib/payments/errors'
import { toSmallestUnit, type CurrencyCode } from '@/lib/payments/currency'

// Map frontend plan IDs to backend tier names
const PLAN_TIER_MAP: Record<string, string> = {
  pro: 'sadhak',
  circle: 'siddha',
}

const BILLING_MAP: Record<string, string> = {
  monthly: 'monthly',
  annual: 'yearly',
}

// ── OUTER WRAPPER ────────────────────────────────────────────────────────

interface StripePaymentWrapperProps {
  planId: string
  billing: string
  currency: string
  planLabel: string
  planPrice: number
  onSuccess: () => void
  onError: (message: string) => void
}

export function StripePaymentWrapper({
  planId,
  billing,
  currency,
  planLabel,
  planPrice,
  onSuccess,
  onError,
}: StripePaymentWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [intentType, setIntentType] = useState<'payment' | 'setup'>('payment')
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setInitError(null)
      try {
        const backendTier = PLAN_TIER_MAP[planId] || planId
        const backendBilling = BILLING_MAP[billing] || billing

        const res = await apiFetch('/api/subscriptions/embedded-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_tier: backendTier,
            billing_period: backendBilling,
            currency: currency.toLowerCase(),
            payment_method: 'card',
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const msg = typeof data.detail === 'string'
            ? data.detail
            : data.detail?.message || 'Unable to initialize payment.'
          setInitError(msg)
          return
        }

        const data = await res.json()
        setClientSecret(data.client_secret)
        setSubscriptionId(data.subscription_id)
        setIntentType(data.intent_type === 'setup' ? 'setup' : 'payment')
      } catch {
        setInitError('Connection issue. Please refresh and try again.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [planId, billing, currency])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <SacredOMLoader size={36} message="Preparing payment..." />
      </div>
    )
  }

  if (initError) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <p className="sacred-text-ui text-xs text-red-400 text-center">{initError}</p>
        <p className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)] text-center mt-2">
          You can also use the standard checkout below.
        </p>
      </div>
    )
  }

  if (!clientSecret) return null

  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        appearance: STRIPE_APPEARANCE,
        loader: 'auto',
      }}
    >
      <StripePaymentInner
        currency={currency}
        planLabel={planLabel}
        planPrice={planPrice}
        billing={billing}
        clientSecret={clientSecret}
        intentType={intentType}
        subscriptionId={subscriptionId || ''}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}

// ── INNER FORM ───────────────────────────────────────────────────────────

interface StripePaymentInnerProps {
  currency: string
  planLabel: string
  planPrice: number
  billing: string
  clientSecret: string
  intentType: 'payment' | 'setup'
  subscriptionId: string
  onSuccess: () => void
  onError: (message: string) => void
}

function StripePaymentInner({
  currency,
  planLabel,
  planPrice,
  billing,
  clientSecret,
  intentType,
  subscriptionId,
  onSuccess,
  onError,
}: StripePaymentInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const isINR = currency.toLowerCase() === 'inr'

  // Calculate amount in smallest currency unit for the PaymentRequest button.
  // For trial subscriptions (intentType === 'setup'), the first charge is 0
  // but we show the regular price so users know what they're signing up for.
  const expressAmount = (() => {
    if (intentType === 'setup') {
      // Trial: show $0 (first charge is free). Google Pay sheet will show
      // the plan name which indicates it's a trial setup.
      return 0
    }
    // Non-trial: show the actual charge amount
    const price = billing === 'annual' ? planPrice * 12 : planPrice
    return toSmallestUnit(price, currency.toUpperCase() as CurrencyCode)
  })()

  const returnUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/m/subscribe/payment?success=true&subscription=${subscriptionId}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || submitting) return

    setSubmitting(true)
    setErrorMessage(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(translateStripeError(submitError.code))
      setSubmitting(false)
      return
    }

    if (intentType === 'setup') {
      // Trial subscription: confirm SetupIntent
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(translateStripeError(error.code))
        setSubmitting(false)
      } else {
        onSuccess()
      }
    } else {
      // Non-trial: confirm PaymentIntent
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(translateStripeError(error.code))
        setSubmitting(false)
      } else {
        onSuccess()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Express Checkout (Apple Pay / Google Pay) */}
      <ExpressCheckout
        amount={expressAmount}
        currency={currency}
        label={planLabel}
        clientSecret={clientSecret}
        intentType={intentType}
        onSuccess={onSuccess}
        onError={(msg) => {
          setErrorMessage(msg)
          onError(msg)
        }}
      />

      {/* Stripe PaymentElement — shows cards, UPI (INR), SEPA (EUR), PayPal, Link */}
      <div className="mt-3">
        <p className="sacred-text-ui text-[9px] text-[var(--sacred-divine-gold)] tracking-[0.14em] uppercase mb-2">
          Payment details
        </p>
        <PaymentElement
          onChange={(event) => setIsComplete(event.complete)}
          options={{
            layout: {
              type: 'accordion',
              defaultCollapsed: false,
              radios: 'always',
              spacedAccordionItems: true,
            },
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
            fields: {
              billingDetails: {
                email: 'never',
                address: {
                  country: 'auto',
                  postalCode: 'auto',
                },
              },
            },
          }}
        />
      </div>

      {/* UPI note */}
      {isINR && (
        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-[10px] bg-[rgba(6,182,212,0.06)] border border-[rgba(6,182,212,0.2)]">
          <span className="text-emerald-400 text-xs mt-px">i</span>
          <span className="sacred-text-ui text-[11px] text-[var(--sacred-text-secondary)]">
            UPI, Google Pay UPI, PhonePe, and Paytm appear above when available for your account.
          </span>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="sacred-text-ui text-xs text-red-400 text-center">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting || !isComplete}
        className="sacred-btn-divine sacred-shimmer-on-tap w-full !h-[52px] flex items-center justify-center gap-2 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <SacredOMLoader size={24} />
        ) : intentType === 'setup' ? (
          'Start My 7-Day Free Trial'
        ) : (
          'Complete Payment'
        )}
      </button>
    </form>
  )
}
