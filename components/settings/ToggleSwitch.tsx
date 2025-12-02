'use client'

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
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => onToggle(!enabled)}
      className={`relative h-6 w-11 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled
          ? 'bg-orange-500 border-orange-400'
          : 'bg-slate-800 border-orange-500/30'
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default ToggleSwitch
