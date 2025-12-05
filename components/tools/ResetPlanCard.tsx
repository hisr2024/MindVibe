'use client'

export interface ResetPlanStep {
  /** Step number */
  step: number
  /** Step title */
  title: string
  /** Step content/guidance */
  content: string
  /** Color variant */
  variant?: 'orange' | 'purple' | 'green' | 'blue'
}

export interface ResetPlanCardProps {
  /** The step data */
  step: ResetPlanStep
  /** Whether the card is revealed */
  revealed?: boolean
  /** Optional className */
  className?: string
}

const variantStyles = {
  orange: {
    border: 'border-orange-400/40',
    bg: 'bg-gradient-to-br from-orange-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(255,115,39,0.12)]',
    stepBg: 'bg-orange-500/30',
    stepBorder: 'border-orange-400',
    stepText: 'text-orange-50',
    titleText: 'text-orange-50',
    contentBg: 'bg-black/30 border-orange-500/15',
    contentText: 'text-orange-100/90',
  },
  purple: {
    border: 'border-purple-400/40',
    bg: 'bg-gradient-to-br from-purple-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(167,139,250,0.08)]',
    stepBg: 'bg-purple-500/30',
    stepBorder: 'border-purple-400',
    stepText: 'text-purple-50',
    titleText: 'text-purple-50',
    contentBg: 'bg-black/30 border-purple-500/15',
    contentText: 'text-purple-100/90',
  },
  green: {
    border: 'border-green-400/40',
    bg: 'bg-gradient-to-br from-green-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(74,222,128,0.08)]',
    stepBg: 'bg-green-500/30',
    stepBorder: 'border-green-400',
    stepText: 'text-green-50',
    titleText: 'text-green-50',
    contentBg: 'bg-black/30 border-green-500/15',
    contentText: 'text-green-100/90',
  },
  blue: {
    border: 'border-blue-400/40',
    bg: 'bg-gradient-to-br from-blue-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(96,165,250,0.08)]',
    stepBg: 'bg-blue-500/30',
    stepBorder: 'border-blue-400',
    stepText: 'text-blue-50',
    titleText: 'text-blue-50',
    contentBg: 'bg-black/30 border-blue-500/15',
    contentText: 'text-blue-100/90',
  },
}

/**
 * ResetPlanCard component for displaying reset plan steps.
 *
 * Features:
 * - Four color variants
 * - Reveal animation support
 * - Step number indicator
 * - Accessibility attributes
 * - Responsive design
 */
export function ResetPlanCard({
  step,
  revealed = true,
  className = '',
}: ResetPlanCardProps) {
  const variant = step.variant || 'orange'
  const styles = variantStyles[variant]

  return (
    <div
      className={`rounded-2xl border ${styles.border} ${styles.bg} p-5 ${styles.shadow} transition-opacity duration-500 ${
        revealed ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      role="region"
      aria-label={step.title}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`h-8 w-8 rounded-full ${styles.stepBg} ${styles.stepText} border ${styles.stepBorder} flex items-center justify-center text-sm font-bold`}
          aria-hidden="true"
        >
          {step.step}
        </span>
        <h3 className={`text-lg font-semibold ${styles.titleText}`}>
          {step.title}
        </h3>
      </div>
      <div
        className={`text-sm ${styles.contentText} ${styles.contentBg} rounded-lg p-3 border`}
      >
        {step.content}
      </div>
    </div>
  )
}

export default ResetPlanCard
