'use client'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

const variantStyles = {
  default: 'bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#e8b54a]',
  success: 'bg-gradient-to-r from-emerald-400 to-teal-300',
  warning: 'bg-gradient-to-r from-[#d4a44c] to-[#d4a44c]',
  danger: 'bg-gradient-to-r from-red-400 to-rose-400',
}

export function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  size = 'md',
  variant = 'default',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  // Auto-select variant based on percentage if not explicitly set
  const autoVariant = percentage >= 90 ? 'danger' : percentage >= 70 ? 'warning' : variant

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium text-[#f5f0e8]">{label}</span>}
          {showValue && (
            <span className="text-[#f5f0e8]/70">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className={`relative w-full overflow-hidden rounded-full bg-[#d4a44c]/20 ${sizeStyles[size]}`}>
        <div
          className={`h-full transition-all duration-500 ease-out ${variantStyles[autoVariant]} rounded-full`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  )
}

export default ProgressBar
