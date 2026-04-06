'use client'

import { motion } from 'framer-motion'

export type BillingCycle = 'monthly' | 'annual'

interface BillingToggleProps {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full p-1">
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors ${
            value === 'monthly' ? 'text-[#050714]' : 'text-white/70'
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange('annual')}
          className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors ${
            value === 'annual' ? 'text-[#050714]' : 'text-white/70'
          }`}
        >
          Annual
        </button>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#D4A017] to-[#F0C040]"
          style={{
            left: value === 'monthly' ? 4 : '50%',
            right: value === 'annual' ? 4 : '50%',
          }}
        />
      </div>
      {value === 'annual' && (
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
          Save 40%
        </span>
      )}
    </div>
  )
}
