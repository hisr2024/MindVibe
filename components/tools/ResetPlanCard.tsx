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
    title: 'Pause & Breathe',
    icon: '🧘',
    color: 'border-orange-400/40 bg-gradient-to-br from-orange-500/10',
    textColor: 'text-orange-50',
    number: 1,
  },
  {
    key: 'nameTheRipple',
    title: 'Name the Ripple',
    icon: '💧',
    color: 'border-purple-400/40 bg-gradient-to-br from-purple-500/10',
    textColor: 'text-purple-50',
    number: 2,
  },
  {
    key: 'repair',
    title: 'Choose the Repair',
    icon: '🔧',
    color: 'border-green-400/40 bg-gradient-to-br from-green-500/10',
    textColor: 'text-green-50',
    number: 3,
  },
  {
    key: 'moveWithIntention',
    title: 'Move with Intention',
    icon: '🎯',
    color: 'border-blue-400/40 bg-gradient-to-br from-blue-500/10',
    textColor: 'text-blue-50',
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
      className={`space-y-4 ${className}`}
      role="region"
      aria-label="Reset Plan Steps"
    >
      {stepConfig.map((step, idx) => (
        <div
          key={step.key}
          className={`rounded-2xl border ${step.color} via-[#0d0d10]/85 to-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.08)] transition-opacity duration-500 ${
            revealedCards >= idx + 1 ? 'opacity-100' : 'opacity-0'
          }`}
          role="region"
          aria-label={step.title}
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`h-8 w-8 rounded-full bg-${step.key === 'pauseAndBreathe' ? 'orange' : step.key === 'nameTheRipple' ? 'purple' : step.key === 'repair' ? 'green' : 'blue'}-500/30 ${step.textColor} border border-${step.key === 'pauseAndBreathe' ? 'orange' : step.key === 'nameTheRipple' ? 'purple' : step.key === 'repair' ? 'green' : 'blue'}-400 flex items-center justify-center text-sm font-bold`}
              aria-hidden="true"
            >
              {step.number}
            </span>
            <h3 className={`text-lg font-semibold ${step.textColor}`}>
              {step.title}
            </h3>
          </div>
          <div
            className={`text-sm ${step.textColor.replace('50', '100/90')} bg-black/30 rounded-lg p-3 border border-${step.key === 'pauseAndBreathe' ? 'orange' : step.key === 'nameTheRipple' ? 'purple' : step.key === 'repair' ? 'green' : 'blue'}-500/15`}
          >
            {planValues[step.key]}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ResetPlanCard
