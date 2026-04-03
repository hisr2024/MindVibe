'use client'

/**
 * UPIPayment — UPI ID input + popular UPI app grid
 *
 * Text input for UPI ID (yourname@upi) with a 2x2 grid
 * of popular apps: GPay, PhonePe, Paytm, BHIM.
 */

import { useState } from 'react'

interface UPIPaymentProps {
  onSubmit: (upiId: string) => void
  onAppSelect: (app: string) => void
  loading?: boolean
}

const UPI_APPS = [
  { id: 'gpay', name: 'GPay', color: '#4285F4', icon: 'G' },
  { id: 'phonepe', name: 'PhonePe', color: '#5F259F', icon: 'P' },
  { id: 'paytm', name: 'Paytm', color: '#00BAF2', icon: 'P' },
  { id: 'bhim', name: 'BHIM', color: '#00897B', icon: 'B' },
]

export function UPIPayment({ onSubmit, onAppSelect, loading }: UPIPaymentProps) {
  const [upiId, setUpiId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!upiId || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. name@upi)')
      return
    }
    setError('')
    onSubmit(upiId)
  }

  return (
    <div className="space-y-4">
      {/* UPI ID Input */}
      <div>
        <label className="block sacred-text-ui text-xs text-[var(--sacred-text-secondary)] mb-1.5 ml-1">
          UPI ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="yourname@upi"
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value)
              setError('')
            }}
            className="sacred-input flex-1 px-4 py-3 text-sm"
            autoCapitalize="none"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!upiId || loading}
            className="sacred-btn-divine px-5 !h-[48px] text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Verify'
            )}
          </button>
        </div>
        {error && (
          <p className="sacred-text-ui text-xs text-red-400 mt-1 ml-1">{error}</p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[rgba(212,160,23,0.15)]" />
        <span className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)]">or pay with</span>
        <div className="flex-1 h-px bg-[rgba(212,160,23,0.15)]" />
      </div>

      {/* UPI App Grid */}
      <div className="grid grid-cols-4 gap-3">
        {UPI_APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onAppSelect(app.id)}
            disabled={loading}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.08)] transition-all active:scale-[0.95] disabled:opacity-50"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: app.color }}
            >
              {app.icon}
            </div>
            <span className="sacred-text-ui text-[10px] text-[var(--sacred-text-secondary)]">
              {app.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default UPIPayment
