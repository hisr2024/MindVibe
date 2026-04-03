'use client'

/**
 * PaymentForm — Card/UPI/NetBanking/Wallet payment method tabs
 *
 * 4 payment method tabs with active state (gold border + text).
 * Renders the appropriate sub-form based on selected method.
 * Integrates with Razorpay (India) or Stripe (International).
 */

import { useState } from 'react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { CardInputGroup } from './CardInputGroup'
import { UPIPayment } from './UPIPayment'

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet'

interface PaymentFormProps {
  currency: string
  onPaymentMethodChange?: (method: PaymentMethod) => void
}

const PAYMENT_TABS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'wallet', label: 'Wallet', icon: '👛' },
]

const BANKS = [
  'SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak',
  'PNB', 'Yes Bank', 'BOB', 'Canara', 'IDFC',
]

const WALLETS = [
  { id: 'paytm', name: 'Paytm Wallet', color: '#00BAF2' },
  { id: 'amazon', name: 'Amazon Pay', color: '#FF9900' },
  { id: 'mobikwik', name: 'MobiKwik', color: '#E91E63' },
  { id: 'airtel', name: 'Airtel Money', color: '#ED1C24' },
]

export function PaymentForm({ currency, onPaymentMethodChange }: PaymentFormProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('card')
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [saveCard, setSaveCard] = useState(true)
  const [selectedBank, setSelectedBank] = useState('')

  const handleMethodChange = (method: PaymentMethod) => {
    triggerHaptic('selection')
    setActiveMethod(method)
    onPaymentMethodChange?.(method)
  }

  // Hide UPI/NetBanking/Wallet for non-INR currencies
  const isINR = currency === 'INR'
  const visibleTabs = isINR ? PAYMENT_TABS : PAYMENT_TABS.filter(t => t.id === 'card')

  return (
    <div className="space-y-4">
      {/* Method Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleMethodChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sacred-text-ui whitespace-nowrap transition-all ${
              activeMethod === tab.id
                ? 'bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.4)] text-[var(--sacred-divine-gold-bright)]'
                : 'bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.08)] text-[var(--sacred-text-muted)]'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card Form */}
      {activeMethod === 'card' && (
        <div className="space-y-3">
          <CardInputGroup
            value={cardData}
            onChange={setCardData}
          />
          {/* Save card checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border transition-all flex items-center justify-center flex-shrink-0 ${
                saveCard
                  ? 'bg-[var(--sacred-krishna-blue)] border-[var(--sacred-divine-gold)]'
                  : 'bg-[rgba(22,26,66,0.55)] border-[rgba(212,160,23,0.3)]'
              }`}
            >
              <svg
                className={`w-2.5 h-2.5 text-white transition-opacity ${saveCard ? 'opacity-100' : 'opacity-0'}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="2 6 5 9 10 3" />
              </svg>
            </div>
            <span className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)]">
              Save card for future offerings
            </span>
          </label>
        </div>
      )}

      {/* UPI Form */}
      {activeMethod === 'upi' && isINR && (
        <UPIPayment
          onSubmit={(upiId) => {
            // UPI ID verification handled by Razorpay
          }}
          onAppSelect={(app) => {
            // Deep link to UPI app handled by Razorpay
          }}
        />
      )}

      {/* Net Banking */}
      {activeMethod === 'netbanking' && isINR && (
        <div>
          <label className="block sacred-text-ui text-xs text-[var(--sacred-text-secondary)] mb-1.5 ml-1">
            Select your bank
          </label>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="sacred-input w-full px-4 py-3 text-sm appearance-none cursor-pointer"
          >
            <option value="">Choose a bank...</option>
            {BANKS.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          <p className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)] mt-2 ml-1">
            You will be redirected to your bank's secure portal
          </p>
        </div>
      )}

      {/* Wallet */}
      {activeMethod === 'wallet' && isINR && (
        <div className="grid grid-cols-2 gap-3">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.08)] transition-all active:scale-[0.97]"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: wallet.color }}
              >
                {wallet.name.charAt(0)}
              </div>
              <span className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)]">
                {wallet.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PaymentForm
