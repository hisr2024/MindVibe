'use client'

/**
 * ExpressCheckout — Apple Pay + Google Pay via PaymentRequestButton
 *
 * Renders the Stripe PaymentRequestButton which shows:
 * - Apple Pay on Safari (iOS/Mac) when user has a card in Apple Wallet
 * - Google Pay on Chrome (Android/Desktop) when user has saved cards
 *
 * If neither is available, this component renders nothing (graceful hide).
 * Must be used inside an <Elements> provider with a valid client_secret.
 *
 * IMPORTANT: This component handles two distinct intent types:
 * - PaymentIntent (non-trial): confirmed via stripe.confirmCardPayment()
 * - SetupIntent (trial subscriptions): confirmed via stripe.confirmCardSetup()
 * The intent type is passed from the parent via the intentType prop.
 */

import { useEffect, useState, useRef } from 'react'
import { useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js'
import type { PaymentRequest } from '@stripe/stripe-js'
import { PAYMENT_FLAGS } from '@/lib/feature-flags'
import { translateStripeError } from '@/lib/payments/errors'

interface ExpressCheckoutProps {
  amount: number
  currency: string
  label: string
  clientSecret: string
  intentType: 'payment' | 'setup'
  onSuccess: () => void
  onError: (message: string) => void
}

export function ExpressCheckout({
  amount,
  currency,
  label,
  clientSecret,
  intentType,
  onSuccess,
  onError,
}: ExpressCheckoutProps) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [canPay, setCanPay] = useState<{ applePay?: boolean; googlePay?: boolean } | null>(null)

  // Refs to hold the latest values so the event handler always sees
  // current props without needing to re-register the listener.
  const clientSecretRef = useRef(clientSecret)
  const intentTypeRef = useRef(intentType)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  // Sync refs in an effect to satisfy react-hooks/refs lint rule.
  useEffect(() => {
    clientSecretRef.current = clientSecret
    intentTypeRef.current = intentType
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!stripe) return
    if (!PAYMENT_FLAGS.googlePay && !PAYMENT_FLAGS.applePay) return

    const pr = stripe.paymentRequest({
      country: currency.toLowerCase() === 'inr' ? 'IN' : 'DE',
      currency: currency.toLowerCase(),
      total: {
        label,
        amount,
        pending: false,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    })

    // Check availability BEFORE rendering the button to prevent CLS
    pr.canMakePayment().then((result) => {
      if (result) {
        // Respect feature flags for individual methods
        const googleAvailable = result.googlePay && PAYMENT_FLAGS.googlePay
        const appleAvailable = result.applePay && PAYMENT_FLAGS.applePay

        if (googleAvailable || appleAvailable) {
          setCanPay({
            googlePay: googleAvailable || false,
            applePay: appleAvailable || false,
          })
          setPaymentRequest(pr)
        }
      }
    })

    // Handle payment method from Google/Apple Pay sheet.
    // CRITICAL: Confirm the intent BEFORE calling event.complete().
    // Calling event.complete('success') before confirmation causes the
    // Google Pay sheet to close while payment hasn't actually succeeded.
    pr.on('paymentmethod', async (event) => {
      if (!stripe) {
        event.complete('fail')
        onErrorRef.current('Payment processor not ready. Please try again.')
        return
      }

      try {
        if (intentTypeRef.current === 'setup') {
          // Trial subscription: confirm SetupIntent to save payment method
          const { error } = await stripe.confirmCardSetup(
            clientSecretRef.current,
            { payment_method: event.paymentMethod.id },
          )

          if (error) {
            event.complete('fail')
            onErrorRef.current(translateStripeError(error.code))
          } else {
            event.complete('success')
            onSuccessRef.current()
          }
        } else {
          // Non-trial: confirm PaymentIntent to charge immediately
          const { error } = await stripe.confirmCardPayment(
            clientSecretRef.current,
            { payment_method: event.paymentMethod.id },
          )

          if (error) {
            event.complete('fail')
            onErrorRef.current(translateStripeError(error.code))
          } else {
            event.complete('success')
            onSuccessRef.current()
          }
        }
      } catch {
        event.complete('fail')
        onErrorRef.current('Payment failed. Please try again or use a different method.')
      }
    })

    // PaymentRequest does not expose an .off() method in the Stripe.js
    // type definitions, so we rely on the object being garbage-collected
    // when the component unmounts (no references are held externally).
    // The refs pattern above ensures the handler always reads current props.
  }, [stripe, amount, currency, label])

  // Do not render if not available or still checking
  if (!paymentRequest || !canPay) return null

  return (
    <div className="mb-4">
      <p className="sacred-text-ui text-[9px] text-[var(--sacred-divine-gold)] tracking-[0.14em] uppercase text-center mb-2">
        Express Checkout
      </p>

      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'default',
              theme: 'dark',
              height: '52px',
            },
          },
        }}
      />

      <p className="sacred-text-ui text-[9px] text-[var(--sacred-text-muted)] text-center mt-1.5">
        {canPay.applePay && 'Apple Pay available'}
        {canPay.applePay && canPay.googlePay && ' \u00b7 '}
        {canPay.googlePay && 'Google Pay available'}
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
        <span className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)]">
          or pay another way
        </span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
      </div>
    </div>
  )
}
