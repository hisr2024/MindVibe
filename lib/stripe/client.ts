/**
 * Stripe.js client singleton — load once, reuse everywhere.
 *
 * Uses the NEXT_PUBLIC_STRIPE_KEY (publishable key) to load Stripe.js.
 * Falls back to NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for compatibility.
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    stripePromise = loadStripe(key, {
      locale: 'auto',
    })
  }
  return stripePromise
}
