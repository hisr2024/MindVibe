'use client'

import { STEP_TITLES, type EmotionalResetStep } from '@/types/emotional-reset.types'

interface StepIndicatorProps {
  currentStep: number
  totalSteps?: number
  className?: string
}

/**
 * Progress indicator showing current step (1/7 to 7/7)
 * with visual progress bar and step labels
 */
export function StepIndicator({
  currentStep,
  totalSteps = 7,
  className = '',
}: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100
  const stepTitle = STEP_TITLES[currentStep as EmotionalResetStep] || 'Loading...'

  return (
    <div className={`space-y-3 ${className}`} role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${currentStep} of ${totalSteps}: ${stepTitle}`}>
      {/* Step info */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-orange-50">{stepTitle}</span>
        <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-100">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-orange-400 via-[#ffb347] to-amber-300 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Glow effect */}
        <div
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm transition-all duration-500"
          style={{ left: `calc(${progress}% - 16px)` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between px-1">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1
          const isComplete = step < currentStep
          const isCurrent = step === currentStep
          
          return (
            <div
              key={step}
              className={`flex h-2 w-2 items-center justify-center rounded-full transition-all duration-300 ${
                isComplete
                  ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                  : isCurrent
                  ? 'bg-orange-300 ring-2 ring-orange-400/50 ring-offset-1 ring-offset-slate-900'
                  : 'bg-white/20'
              }`}
              aria-hidden="true"
            />
          )
        })}
      </div>
    </div>
  )
}

export default StepIndicator
