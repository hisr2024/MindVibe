'use client'

/**
 * PaymentSummary — Order breakdown card
 *
 * Shows plan name, billing cycle, price, trial discount,
 * and the "Due today" amount (₹0.00 during trial) in gold.
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
    <div className="rounded-[20px] overflow-hidden border border-[rgba(212,160,23,0.2)] bg-[var(--sacred-gradient-card)]">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.25)] sacred-text-ui text-[10px] text-[var(--sacred-divine-gold-bright)] font-medium uppercase tracking-wider">
            {planName}
          </span>
        </div>
        <p className="sacred-text-divine text-xl text-[var(--sacred-text-primary)]">
          {formatPrice(price, currency)}<span className="text-sm text-[var(--sacred-text-muted)]">/month</span>
        </p>
        {isAnnual && (
          <p className="sacred-text-ui text-xs text-[var(--sacred-text-muted)] mt-0.5">
            Billed annually · {formatPrice(totalAmount, currency)}/year
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[rgba(212,160,23,0.12)] mx-5" />

      {/* Line items */}
      <div className="px-5 py-3 space-y-2">
        <div className="flex justify-between">
          <span className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)]">
            {planName} ({billingLabel})
          </span>
          <span className="sacred-text-ui text-sm text-[var(--sacred-text-primary)]">
            {formatPrice(totalAmount, currency)}
          </span>
        </div>

        {hasTrial && (
          <div className="flex justify-between">
            <span className="sacred-text-ui text-sm text-emerald-400">
              {trialDays}-day free trial
            </span>
            <span className="sacred-text-ui text-sm text-emerald-400">
              -{formatPrice(totalAmount, currency)}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="sacred-divider mx-5 !my-0" />

      {/* Total */}
      <div className="px-5 py-3">
        <div className="flex justify-between items-center">
          <span className="sacred-text-ui text-sm font-medium text-[var(--sacred-text-primary)]">
            Due today
          </span>
          <span className="sacred-text-divine text-lg text-[var(--sacred-divine-gold-bright)] flex items-center gap-1">
            {formatPrice(dueToday, currency)}
            {hasTrial && <span className="text-xs">✦</span>}
          </span>
        </div>
        {hasTrial && (
          <p className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)] text-right mt-0.5">
            After {trialDays} days: {formatPrice(totalAmount, currency)}/{isAnnual ? 'year' : 'month'}
          </p>
        )}
      </div>
    </div>
  )
}

export default PaymentSummary
