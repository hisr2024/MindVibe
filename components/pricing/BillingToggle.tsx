'use client'

interface BillingToggleProps {
  isYearly: boolean
  onToggle: (yearly: boolean) => void
  yearlySavings?: number
  className?: string
}

export function BillingToggle({ isYearly, onToggle, yearlySavings = 20, className = '' }: BillingToggleProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <button
        onClick={() => onToggle(false)}
        className={`text-sm font-semibold transition-colors ${
          !isYearly ? 'text-orange-50' : 'text-orange-100/60 hover:text-orange-100/80'
        }`}
      >
        Monthly
      </button>
      
      <button
        onClick={() => onToggle(!isYearly)}
        className="relative h-8 w-14 rounded-full border border-orange-500/30 bg-black/40 transition-colors hover:border-orange-400"
        aria-label={`Switch to ${isYearly ? 'monthly' : 'yearly'} billing`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 transition-transform ${
            isYearly ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(true)}
          className={`text-sm font-semibold transition-colors ${
            isYearly ? 'text-orange-50' : 'text-orange-100/60 hover:text-orange-100/80'
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
