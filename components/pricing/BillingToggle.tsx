'use client'

interface BillingToggleProps {
  isYearly: boolean
  onToggle: (yearly: boolean) => void
  yearlySavings?: number
  className?: string
}

export function BillingToggle({ isYearly, onToggle, yearlySavings = 20, className = '' }: BillingToggleProps) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        onClick={() => onToggle(false)}
        className={`text-sm font-semibold transition-colors min-w-[70px] text-right ${
          !isYearly ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/60 hover:text-[#f5f0e8]/80'
        }`}
      >
        Monthly
      </button>

      <button
        onClick={() => onToggle(!isYearly)}
        className="relative h-8 w-14 flex-shrink-0 rounded-full border border-[#d4a44c]/30 bg-black/40 transition-colors hover:border-[#d4a44c]"
        aria-label={`Switch to ${isYearly ? 'monthly' : 'yearly'} billing`}
      >
        <span
          className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] transition-transform ${
            isYearly ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>

      <div className="flex min-w-[70px] items-center gap-2">
        <button
          onClick={() => onToggle(true)}
          className={`text-sm font-semibold transition-colors ${
            isYearly ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/60 hover:text-[#f5f0e8]/80'
          }`}
        >
          Yearly
        </button>
        {yearlySavings > 0 && (
          <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-50">
            Save {yearlySavings}%
          </span>
        )}
      </div>
    </div>
  )
}

export default BillingToggle
