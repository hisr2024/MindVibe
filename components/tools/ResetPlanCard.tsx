/**
 * ResetPlanCard - Displays karma reset plan with both legacy 4-step
 * and new 7-phase deep Gita journey formats.
 *
 * Features:
 * - DeepResetPlanCard: 7-phase overview with clickable navigation
 * - ResetPlanCard: Legacy 4-step plan (backward compatible)
 * - Animated reveal with staggered transitions
 * - Accessible with proper ARIA labels
 * - Responsive layout
 */

'use client'

import { useEffect, useState } from 'react'
import { PHASE_ICONS } from '@/types/karma-reset.types'
import type { PhaseGuidance } from '@/types/karma-reset.types'

// ==================== DEEP 7-PHASE PLAN CARD ====================

export interface DeepResetPlanCardProps {
  /** The 7-phase guidance from deep karma reset */
  phases: PhaseGuidance[]
  /** Currently active phase index */
  currentPhase: number
  /** Callback when a phase is clicked */
  onPhaseClick: (index: number) => void
  /** Additional className */
  className?: string
}

/**
 * DeepResetPlanCard - Displays the 7-phase karma reset journey overview.
 *
 * Shows all phases as a compact timeline with icons, names, and completion state.
 * Clicking a phase navigates to it in the main view.
 */
export function DeepResetPlanCard({
  phases,
  currentPhase,
  onPhaseClick,
  className = '',
}: DeepResetPlanCardProps) {
  return (
    <div
      className={`divine-reset-container rounded-3xl p-5 ${className}`}
      role="navigation"
      aria-label="Karma Reset Journey Phases"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{'\u{1F4FF}'}</span>
        <h3 className="text-sm font-semibold text-[#f5f0e8]/80">
          Your Sacred Journey &mdash; 7 Phases
        </h3>
      </div>

      <div className="space-y-1.5">
        {phases.map((phase, idx) => {
          const isActive = idx === currentPhase
          const isCompleted = idx < currentPhase
          const icon = PHASE_ICONS[phase.icon] || '\u2728'

          return (
            <button
              key={phase.phase}
              onClick={() => onPhaseClick(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 ${
                isActive
                  ? 'bg-[#d4a44c]/10 border border-[#d4a44c]/30'
                  : isCompleted
                  ? 'bg-[#d4a44c]/5 border border-transparent hover:border-[#d4a44c]/15'
                  : 'bg-transparent border border-transparent hover:bg-white/[0.02]'
              }`}
              aria-label={`Phase ${phase.phase}: ${phase.english_name}${isActive ? ' (current)' : ''}${isCompleted ? ' (completed)' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Phase number */}
              <span
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-[#c8943a] to-[#e8b54a] text-[#0a0a12] shadow-lg'
                    : isCompleted
                    ? 'bg-[#d4a44c]/30 text-[#e8b54a]'
                    : 'bg-[#d4a44c]/10 text-[#d4a44c]/40'
                }`}
              >
                {isCompleted ? '\u2713' : phase.phase}
              </span>

              {/* Phase icon + name */}
              <span className={`text-sm ${isActive ? '' : 'opacity-70'}`}>{icon}</span>
              <div className="min-w-0 flex-1">
                <span
                  className={`text-sm font-medium block truncate ${
                    isActive
                      ? 'text-[#f5f0e8]'
                      : isCompleted
                      ? 'text-[#f5f0e8]/60'
                      : 'text-[#f5f0e8]/40'
                  }`}
                >
                  {phase.name}
                </span>
                <span
                  className={`text-[10px] block truncate ${
                    isActive ? 'text-[#d4a44c]/60' : 'text-[#d4a44c]/30'
                  }`}
                >
                  {phase.english_name}
                </span>
              </div>

              {/* Active indicator */}
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#e8b54a] flex-shrink-0 animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}


// ==================== LEGACY 4-STEP PLAN CARD ====================

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
 * ResetPlanCard component - Legacy 4-element karma reset plan display.
 *
 * Maintained for backward compatibility with the original API response format.
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
