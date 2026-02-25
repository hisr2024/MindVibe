'use client'

import * as Switch from '@radix-ui/react-switch'
import { motion } from 'framer-motion'

interface ToggleSwitchProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export function ToggleSwitch({
  enabled,
  onToggle,
  disabled = false,
  label,
  className = '',
}: ToggleSwitchProps) {
  return (
    <Switch.Root
      checked={enabled}
      onCheckedChange={onToggle}
      disabled={disabled}
      aria-label={label}
      className={`relative h-6 w-11 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled
          ? 'bg-[#d4a44c] border-[#d4a44c]'
          : 'bg-slate-800 border-[#d4a44c]/30'
      } ${className}`}
    >
      <Switch.Thumb asChild>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`block h-5 w-5 rounded-full bg-white shadow-sm ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </Switch.Thumb>
    </Switch.Root>
  )
}

export default ToggleSwitch
