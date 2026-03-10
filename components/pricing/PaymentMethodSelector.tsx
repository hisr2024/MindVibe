'use client'

import { type Currency } from '@/hooks/useCurrency'

export type PaymentMethod = 'card' | 'paypal' | 'upi' | 'google_pay'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onChange: (method: PaymentMethod) => void
  currency: Currency
  className?: string
}

interface MethodDef {
  id: PaymentMethod
  label: string
  description: string
  /** Only show when currency is INR */
  inrOnly?: boolean
  /** Hide when currency is INR (e.g. PayPal doesn't support INR via Stripe) */
  hideForInr?: boolean
}

const METHODS: MethodDef[] = [
  {
    id: 'card',
    label: 'Card',
    description: 'Credit or Debit Card',
  },
  {
    id: 'google_pay',
    label: 'Google Pay',
    description: 'Pay with Google Pay',
    hideForInr: true,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Pay with PayPal',
    hideForInr: true,
  },
  {
    id: 'upi',
    label: 'UPI',
    description: 'GPay, PhonePe, etc.',
    inrOnly: true,
  },
]

export function PaymentMethodSelector({
  selected,
  onChange,
  currency,
  className = '',
}: PaymentMethodSelectorProps) {
  const availableMethods = METHODS.filter((m) => {
    if (m.inrOnly && currency !== 'INR') return false
    if (m.hideForInr && currency === 'INR') return false
    return true
  })

  return (
    <div className={`w-full max-w-xl ${className}`}>
      <p className="mb-2 text-center text-sm font-medium text-[#f5f0e8]/80">
        Payment Method
      </p>
      <div
        className="flex gap-3 justify-center"
        role="radiogroup"
        aria-label="Payment method"
      >
        {availableMethods.map((method) => (
          <button
            key={method.id}
            role="radio"
            aria-checked={selected === method.id}
            onClick={() => onChange(method.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-5 py-3 text-sm font-medium border transition-all duration-200 min-w-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              selected === method.id
                ? 'border-[#d4a44c]/50 bg-[#d4a44c]/15 text-[#f5f0e8] shadow-md shadow-[#d4a44c]/10'
                : 'border-[#d4a44c]/15 bg-[#0d0d10]/85 text-[#f5f0e8]/75 hover:border-[#d4a44c]/30 hover:text-[#f5f0e8]/80'
            }`}
          >
            <span className="text-base font-semibold">{method.label}</span>
            <span className="text-xs opacity-70">{method.description}</span>
          </button>
        ))}
      </div>
      {currency === 'INR' && selected === 'upi' && (
        <p className="mt-2 text-center text-xs text-emerald-400/80">
          Pay instantly with UPI — Google Pay, PhonePe, Paytm, and more.
        </p>
      )}
      {selected === 'google_pay' && currency !== 'INR' && (
        <p className="mt-2 text-center text-xs text-[#f5f0e8]/60">
          Google Pay will appear on the checkout page if supported by your device.
        </p>
      )}
      {selected === 'paypal' && (
        <p className="mt-2 text-center text-xs text-[#f5f0e8]/60">
          You&apos;ll be redirected to PayPal to complete your payment.
        </p>
      )}
    </div>
  )
}

export default PaymentMethodSelector
