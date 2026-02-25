'use client'

import { type Currency } from '@/hooks/useCurrency'

export type PaymentMethod = 'card' | 'paypal' | 'upi'

interface PaymentMethodSelectorProps {
  selected: PaymentMethod
  onChange: (method: PaymentMethod) => void
  currency: Currency
  className?: string
}

const METHODS: { id: PaymentMethod; label: string; description: string; inrOnly: boolean }[] = [
  {
    id: 'card',
    label: 'Card',
    description: 'Credit or Debit Card',
    inrOnly: false,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Pay with PayPal',
    inrOnly: false,
  },
  {
    id: 'upi',
    label: 'UPI',
    description: 'Google Pay, PhonePe, etc.',
    inrOnly: true,
  },
]

export function PaymentMethodSelector({
  selected,
  onChange,
  currency,
  className = '',
}: PaymentMethodSelectorProps) {
  const availableMethods = METHODS.filter((m) => !m.inrOnly || currency === 'INR')

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
                : 'border-[#d4a44c]/15 bg-[#0d0d10]/85 text-[#f5f0e8]/60 hover:border-[#d4a44c]/30 hover:text-[#f5f0e8]/80'
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
    </div>
  )
}

export default PaymentMethodSelector
