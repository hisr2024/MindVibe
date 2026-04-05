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
 */

import { useEffect, useState } from 'react'
import { useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js'
import type { PaymentRequest } from '@stripe/stripe-js'

interface ExpressCheckoutProps {
  amount: number
  currency: string
  label: string
  onPaymentMethod: (paymentMethodId: string) => void
  onError: (message: string) => void
}

export function ExpressCheckout({
  amount,
  currency,
  label,
  onPaymentMethod,
  onError,
}: ExpressCheckoutProps) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [canPay, setCanPay] = useState<{ applePay?: boolean; googlePay?: boolean } | null>(null)

  useEffect(() => {
    if (!stripe) return

    const pr = stripe.paymentRequest({
      country: currency.toLowerCase() === 'inr' ? 'IN' : 'DE',
      currency: currency.toLowerCase(),
      total: {
        label,
        amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    })

    pr.canMakePayment().then((result) => {
      if (result) {
        setCanPay(result)
        setPaymentRequest(pr)
      }
    })

    pr.on('paymentmethod', async (event) => {
      try {
        onPaymentMethod(event.paymentMethod.id)
        event.complete('success')
      } catch {
        event.complete('fail')
        onError('Payment could not be completed. Please try another method.')
      }
    })
  }, [stripe, amount, currency, label, onPaymentMethod, onError])

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
        {canPay.applePay && canPay.googlePay && ' · '}
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
