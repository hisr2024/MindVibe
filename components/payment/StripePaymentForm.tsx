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
 * - EUR: Card, SEPA Direct Debit, Link
 * - USD/GBP: Card, Link
 * - Apple Pay / Google Pay: via ExpressCheckout (PaymentRequestButton)
 */

import { useState, useEffect, useCallback } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/client'
import { STRIPE_APPEARANCE } from '@/lib/stripe/appearance'
import { apiFetch } from '@/lib/api'
import { ExpressCheckout } from './ExpressCheckout'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

// Map frontend plan IDs to backend tier names
const PLAN_TIER_MAP: Record<string, string> = {
  pro: 'sadhak',
  circle: 'siddha',
}

const BILLING_MAP: Record<string, string> = {
  monthly: 'monthly',
  annual: 'yearly',
}

function translateStripeError(code?: string): string {
  const map: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different payment method.',
    card_declined_insufficient_funds: 'Insufficient funds. Please use a different card.',
    expired_card: 'Your card has expired. Please use a current card.',
    incorrect_cvc: 'The security code is incorrect. Please check and try again.',
    processing_error: 'A temporary error occurred. Please try again.',
    authentication_required: 'Your bank requires additional verification. Please complete it.',
    payment_intent_authentication_failure: 'Authentication was not completed. Please try again.',
    upi_transaction_declined: 'UPI payment declined. Please try another UPI app or card.',
    payment_method_not_available: 'This payment method is not available. Please use a card.',
  }
  return map[code ?? ''] ?? 'Payment could not be completed. Please try again or use a different method.'
}

// ── OUTER WRAPPER ────────────────────────────────────────────────────────

interface StripePaymentWrapperProps {
  planId: string
  billing: string
  currency: string
  planLabel: string
  onSuccess: () => void
  onError: (message: string) => void
}

export function StripePaymentWrapper({
  planId,
  billing,
  currency,
  planLabel,
  onSuccess,
  onError,
}: StripePaymentWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
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
  subscriptionId: string
  onSuccess: () => void
  onError: (message: string) => void
}

function StripePaymentInner({
  currency,
  planLabel,
  subscriptionId,
  onSuccess,
}: StripePaymentInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const isINR = currency.toLowerCase() === 'inr'

  const handleExpressPayment = useCallback(async (_paymentMethodId: string) => {
    if (!stripe || !elements) return
    setSubmitting(true)
    setErrorMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/m/subscribe/payment?success=true&subscription=${subscriptionId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(translateStripeError(error.code))
      setSubmitting(false)
    } else {
      onSuccess()
    }
  }, [stripe, elements, subscriptionId, onSuccess])

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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/m/subscribe/payment?success=true&subscription=${subscriptionId}`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMessage(translateStripeError(error.code))
      setSubmitting(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Express Checkout (Apple Pay / Google Pay) */}
      <ExpressCheckout
        amount={0}
        currency={currency}
        label={planLabel}
        onPaymentMethod={handleExpressPayment}
        onError={(msg) => setErrorMessage(msg)}
      />

      {/* Stripe PaymentElement — shows cards, UPI (INR), SEPA (EUR), Link */}
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
        ) : (
          'Start My 7-Day Free Trial'
        )}
      </button>
    </form>
  )
}
