/**
 * Razorpay SDK wrapper for subscription payments (India)
 *
 * Extends the base Razorpay loader from lib/razorpay.ts with
 * subscription-specific payment flows and theme customization.
 */

import { loadRazorpayScript, type RazorpayCheckoutOptions, type RazorpayPaymentResponse } from '@/lib/razorpay'
import { apiFetch } from '@/lib/api'

export interface CreateOrderParams {
  planId: string
  billing: 'monthly' | 'annual'
  currency: string
}

export interface RazorpayOrder {
  id: string
  amount: number
  currency: string
}

/**
 * Create a Razorpay order via backend and open checkout.
 */
export async function initiateRazorpayPayment(params: {
  planId: string
  billing: 'monthly' | 'annual'
  planName: string
  userName?: string
  userEmail?: string
  onSuccess: (response: RazorpayPaymentResponse) => void
  onFailure: (error: string) => void
  onDismiss?: () => void
}): Promise<void> {
  const { planId, billing, planName, userName, userEmail, onSuccess, onFailure, onDismiss } = params

  if (typeof window === 'undefined') {
    onFailure('Payment processing requires a browser environment.')
    return
  }

  // Load Razorpay SDK
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    onFailure('Unable to load payment gateway. Please try again.')
    return
  }

  // Create order on backend
  const res = await apiFetch('/api/subscriptions/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id: planId,
      billing_cycle: billing,
      currency: 'INR',
      provider: 'razorpay',
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    onFailure(data.detail || 'Unable to create payment order. Please try again.')
    return
  }

  const order: RazorpayOrder = await res.json()

  const options: RazorpayCheckoutOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'Kiaanverse',
    description: `${planName} — Sacred Dharmic Companion`,
    order_id: order.id,
    prefill: {
      email: userEmail,
      contact: undefined,
    },
    theme: {
      color: '#D4A017',
    },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.open()
}

/**
 * Verify a Razorpay payment signature via backend.
 */
export async function verifyRazorpayPayment(response: RazorpayPaymentResponse): Promise<boolean> {
  const res = await apiFetch('/api/subscriptions/verify-razorpay-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    }),
  })

  return res.ok
}
