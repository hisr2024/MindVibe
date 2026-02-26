'use client'

import { useEffect, useState } from 'react'

export interface ResetPlanStep {
  title: string
  content: string
}

export interface ResetPlanCardProps {
  /** The 4-element reset plan from backend/KIAAN */
  plan: {
    pauseAndBreathe: string
    nameTheRipple: string
    repair: string
    moveWithIntention: string
  }
  /** Whether cards should animate in sequentially */
  animated?: boolean
  /** Additional className */
  className?: string
}

const stepConfig = [
  {
    key: 'pauseAndBreathe',
    title: 'Sacred Pause',
    icon: '\u{1F9D8}',
    cardClass: 'divine-step-card border-[#d4a44c]/25',
    numberClass: 'bg-gradient-to-br from-[#c8943a] to-[#e8b54a] text-[#0a0a12] border-transparent',
    textColor: 'text-[#f5f0e8]',
    contentTextColor: 'text-[#f5f0e8]/80',
    contentBorderClass: 'border-[#d4a44c]/10',
    number: 1,
  },
  {
    key: 'nameTheRipple',
    title: 'Acknowledge the Ripple',
    icon: '\u{1F4A7}',
    cardClass: 'divine-step-card border-[#d4a44c]/18',
    numberClass: 'bg-gradient-to-br from-[#c8943a]/80 to-[#d4a44c]/80 text-[#0a0a12] border-transparent',
    textColor: 'text-[#f5f0e8]',
    contentTextColor: 'text-[#f5f0e8]/80',
    contentBorderClass: 'border-[#d4a44c]/10',
    number: 2,
  },
  {
    key: 'repair',
    title: 'The Sacred Repair',
    icon: '\u{1F49A}',
    cardClass: 'divine-step-card border-[#d4a44c]/18',
    numberClass: 'bg-gradient-to-br from-[#c8943a]/70 to-[#d4a44c]/70 text-[#0a0a12] border-transparent',
    textColor: 'text-[#f5f0e8]',
    contentTextColor: 'text-[#f5f0e8]/80',
    contentBorderClass: 'border-[#d4a44c]/10',
    number: 3,
  },
  {
    key: 'moveWithIntention',
    title: 'Walk Forward with Grace',
    icon: '\u{1F54A}\uFE0F',
    cardClass: 'divine-step-card border-[#d4a44c]/18',
    numberClass: 'bg-gradient-to-br from-[#c8943a]/60 to-[#d4a44c]/60 text-[#0a0a12] border-transparent',
    textColor: 'text-[#f5f0e8]',
    contentTextColor: 'text-[#f5f0e8]/80',
    contentBorderClass: 'border-[#d4a44c]/10',
    number: 4,
  },
] as const

/**
 * ResetPlanCard component - displays a 4-element karma reset plan.
 * 
 * Features:
 * - Four distinct steps with icons and colors
 * - Optional staggered animation
 * - Accessible with proper headings
 * - Responsive layout
 */
export function ResetPlanCard({
  plan,
  animated = true,
  className = '',
}: ResetPlanCardProps) {
  const [revealedCards, setRevealedCards] = useState(animated ? 0 : 4)

  useEffect(() => {
    if (!animated) return

    const timers = [150, 550, 950, 1350].map((delay, idx) =>
      setTimeout(() => setRevealedCards(idx + 1), delay)
    )
    return () => timers.forEach(timer => clearTimeout(timer))
  }, [animated])

  const planValues: Record<string, string> = {
    pauseAndBreathe: plan.pauseAndBreathe,
    nameTheRipple: plan.nameTheRipple,
    repair: plan.repair,
    moveWithIntention: plan.moveWithIntention,
  }

  return (
    <div
      className={`space-y-3 ${className}`}
      role="region"
      aria-label="Sacred Reset Plan"
    >
      {stepConfig.map((step, idx) => (
        <div
          key={step.key}
          className={`rounded-2xl ${step.cardClass} p-5 transition-all duration-500 ${
            revealedCards >= idx + 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          role="region"
          aria-label={step.title}
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`h-8 w-8 rounded-full ${step.numberClass} flex items-center justify-center text-sm font-bold shadow-lg`}
              aria-hidden="true"
            >
              {step.number}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">{step.icon}</span>
              <h3 className={`text-base font-semibold ${step.textColor}`}>
                {step.title}
              </h3>
            </div>
          </div>
          <div
            className={`text-sm leading-relaxed ${step.contentTextColor} bg-black/20 rounded-xl p-3.5 border ${step.contentBorderClass} font-sacred`}
          >
            {planValues[step.key]}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ResetPlanCard
