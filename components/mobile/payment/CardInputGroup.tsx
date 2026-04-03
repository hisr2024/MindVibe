'use client'

/**
 * CardInputGroup — Grouped card input fields
 *
 * Single container with card number, cardholder name,
 * expiry (MM/YY), and CVV. Auto-formats card number with spaces,
 * detects card brand (Visa/MC/Amex/RuPay).
 */

import { useState } from 'react'

interface CardData {
  number: string
  name: string
  expiry: string
  cvv: string
}

interface CardInputGroupProps {
  value: CardData
  onChange: (data: CardData) => void
  errors?: Partial<Record<keyof CardData, string>>
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'unknown'

function detectCardBrand(number: string): CardBrand {
  const clean = number.replace(/\s/g, '')
  if (/^4/.test(clean)) return 'visa'
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard'
  if (/^3[47]/.test(clean)) return 'amex'
  if (/^(60|65|81|82)/.test(clean)) return 'rupay'
  return 'unknown'
}

function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 16)
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 4)
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)} / ${clean.slice(2)}`
  }
  return clean
}

const BRAND_ICONS: Record<CardBrand, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  amex: 'AMEX',
  rupay: 'RuPay',
  unknown: '',
}

export function CardInputGroup({ value, onChange, errors }: CardInputGroupProps) {
  const brand = detectCardBrand(value.number)

  const update = (field: keyof CardData, raw: string) => {
    onChange({ ...value, [field]: raw })
  }

  return (
    <div className="rounded-[14px] border border-[rgba(212,160,23,0.18)] bg-[rgba(22,26,66,0.55)] overflow-hidden divide-y divide-[rgba(212,160,23,0.1)]">
      {/* Card Number */}
      <div className="relative flex items-center px-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sacred-text-muted)] mr-3 flex-shrink-0">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={formatCardNumber(value.number)}
          onChange={(e) => update('number', e.target.value.replace(/\D/g, '').slice(0, 16))}
          className="w-full bg-transparent py-[13px] text-sm text-[var(--sacred-text-primary)] sacred-text-ui placeholder:text-[var(--sacred-text-muted)] outline-none"
          autoComplete="cc-number"
        />
        {brand !== 'unknown' && (
          <span className="text-[10px] sacred-text-ui font-bold text-[var(--sacred-divine-gold)] px-1.5 py-0.5 rounded bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.2)]">
            {BRAND_ICONS[brand]}
          </span>
        )}
      </div>

      {/* Cardholder Name */}
      <div className="px-4">
        <input
          type="text"
          placeholder="Cardholder name"
          value={value.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full bg-transparent py-[13px] text-sm text-[var(--sacred-text-primary)] sacred-text-ui placeholder:text-[var(--sacred-text-muted)] outline-none"
          autoComplete="cc-name"
        />
      </div>

      {/* Expiry + CVV */}
      <div className="flex divide-x divide-[rgba(212,160,23,0.1)]">
        <div className="flex-1 px-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM / YY"
            value={formatExpiry(value.expiry)}
            onChange={(e) => update('expiry', e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full bg-transparent py-[13px] text-sm text-[var(--sacred-text-primary)] sacred-text-ui placeholder:text-[var(--sacred-text-muted)] outline-none"
            autoComplete="cc-exp"
          />
        </div>
        <div className="flex-1 px-4">
          <input
            type="text"
            inputMode="numeric"
            placeholder="CVV"
            value={value.cvv}
            onChange={(e) => update('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full bg-transparent py-[13px] text-sm text-[var(--sacred-text-primary)] sacred-text-ui placeholder:text-[var(--sacred-text-muted)] outline-none"
            autoComplete="cc-csc"
            maxLength={4}
          />
        </div>
      </div>

      {/* Errors */}
      {errors && Object.values(errors).some(Boolean) && (
        <div className="px-4 py-2">
          {Object.entries(errors).map(([key, err]) =>
            err ? (
              <p key={key} className="sacred-text-ui text-xs text-red-400">{err}</p>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

export default CardInputGroup
