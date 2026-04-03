/**
 * Stripe SDK wrapper for international subscription payments
 *
 * Uses Stripe Checkout Sessions for a hosted payment experience.
 * Only loaded for non-INR currencies.
 */

import { apiFetch } from '@/lib/api'

let stripePromise: Promise<any> | null = null

/**
 * Lazy-load the Stripe.js library.
 */
async function getStripe() {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then(m =>
      m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || '')
    )
  }
  return stripePromise
}

/**
 * Create a Stripe Checkout Session and redirect.
 */
export async function initiateStripePayment(params: {
  planId: string
  billing: 'monthly' | 'annual'
  currency: string
  onFailure: (error: string) => void
}): Promise<void> {
  const { planId, billing, currency, onFailure } = params

  if (typeof window === 'undefined') {
    onFailure('Payment processing requires a browser environment.')
    return
  }

  try {
    const res = await apiFetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billing,
        currency,
        provider: 'stripe',
        success_url: `${window.location.origin}/m/subscribe/payment?success=true`,
        cancel_url: `${window.location.origin}/m/subscribe/payment?cancelled=true`,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      onFailure(data.detail || 'Unable to create payment session.')
      return
    }

    const data = await res.json()

    if (data.checkout_url) {
      // Redirect to Stripe-hosted checkout
      window.location.href = data.checkout_url
    } else if (data.client_secret) {
      // Use embedded Stripe Elements
      const stripe = await getStripe()
      if (!stripe) {
        onFailure('Unable to load payment processor.')
        return
      }
      const { error } = await stripe.confirmPayment({
        clientSecret: data.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/m/subscribe/payment?success=true`,
        },
      })
      if (error) {
        onFailure(error.message || 'Payment was not completed.')
      }
    }
  } catch {
    onFailure('Connection issue. Please try again.')
  }
}
