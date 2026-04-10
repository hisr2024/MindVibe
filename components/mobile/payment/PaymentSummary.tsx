'use client'

/**
 * PaymentSummary — Order breakdown card
 *
 * Shows plan name badge, price/month, billing info,
 * line items, trial discount, "Due today" in gold,
 * and post-trial charge info.
 */

import { type CurrencyCode, formatPrice } from '@/lib/payments/currency'

interface PaymentSummaryProps {
  planName: string
  billing: 'monthly' | 'annual'
  price: number
  currency: CurrencyCode
  trialDays?: number
}

export function PaymentSummary({ planName, billing, price, currency, trialDays }: PaymentSummaryProps) {
  const isAnnual = billing === 'annual'
  const totalAmount = isAnnual ? price * 12 : price
  const hasTrial = trialDays && trialDays > 0
  const dueToday = hasTrial ? 0 : totalAmount
  const billingLabel = isAnnual ? 'Annual' : 'Monthly'

  return (
    <div className="rounded-[20px] overflow-hidden border border-[rgba(212,160,23,0.2)] bg-[linear-gradient(145deg,rgba(22,26,66,0.95),rgba(17,20,53,0.98))]">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 rounded-md bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.25)] text-[10px] font-medium uppercase tracking-[0.08em]"
            style={{
              fontFamily: 'Outfit, system-ui, sans-serif',
              color: '#F0C040',
            }}
          >
            {planName}
          </span>
        </div>
        <p
          className="text-xl text-[#EDE8DC]"
          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
        >
          {formatPrice(price, currency)}
          <span className="text-sm text-[#6B6355]">/month</span>
        </p>
        {isAnnual && (
          <p className="text-[12px] text-[#6B6355] mt-0.5" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Billed annually &middot; {formatPrice(totalAmount, currency)}/year
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(212,160,23,0.12)] mx-5" />

      {/* Line items */}
      <div className="px-5 py-3 space-y-2">
        <div className="flex justify-between">
          <span className="text-[14px] text-[#B8AE98]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            {planName} ({billingLabel})
          </span>
          <span className="text-[14px] text-[#EDE8DC]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            {formatPrice(totalAmount, currency)}
          </span>
        </div>

        {hasTrial && (
          <div className="flex justify-between">
            <span className="text-[14px] text-emerald-400" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              {trialDays}-day free trial
            </span>
            <span className="text-[14px] text-emerald-400" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              -{formatPrice(totalAmount, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(255,255,255,0.06)] mx-5" />

      {/* Total */}
      <div className="px-5 py-3">
        <div className="flex justify-between items-center">
          <span className="text-[14px] font-medium text-[#EDE8DC]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Due today
          </span>
          <span
            className="text-lg flex items-center gap-1"
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              color: '#F0C040',
            }}
          >
            {formatPrice(dueToday, currency)}
            {hasTrial && <span className="text-xs">&#10038;</span>}
          </span>
        </div>
        {hasTrial && (
          <p className="text-[11px] text-[#6B6355] text-right mt-0.5" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Then {formatPrice(price, currency)}/month ({formatPrice(totalAmount, currency)}/{isAnnual ? 'year' : 'month'})
          </p>
        )}
      </div>
    </div>
  )
}

export default PaymentSummary
