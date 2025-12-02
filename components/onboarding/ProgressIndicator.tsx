/**
 * ProgressIndicator Component
 * Responsive stepper (mobile: progress bar, desktop: step indicator)
 */

'use client'

import { motion } from 'framer-motion'

interface Step {
  id: string
  title: string
  isCompleted: boolean
  isCurrent: boolean
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (index: number) => void
  variant?: 'default' | 'compact' | 'minimal'
  className?: string
}

export function ProgressIndicator({
  steps,
  currentStep,
  onStepClick,
  variant = 'default',
  className = '',
}: ProgressIndicatorProps) {
  const progress = ((currentStep + 1) / steps.length) * 100

  // Minimal variant - just dots
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => onStepClick?.(index)}
            disabled={!onStepClick || index > currentStep}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentStep
                ? 'w-8 bg-orange-400'
                : index < currentStep
                ? 'w-2 bg-orange-400/60 cursor-pointer hover:bg-orange-400/80'
                : 'w-2 bg-orange-500/20'
            }`}
            aria-label={`Step ${index + 1}: ${step.title}`}
          />
        ))}
      </div>
    )
  }

  // Compact variant - progress bar only (mobile-friendly)
  if (variant === 'compact') {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-orange-100/60">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-xs text-orange-100/60">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-orange-500/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-300"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }

  // Default variant - full stepper with labels (desktop)
  return (
    <div className={className}>
      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step circle and label */}
            <button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick || index > currentStep}
              className={`flex flex-col items-center ${
                index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-orange-400 border-orange-400 text-slate-900'
                    : index === currentStep
                    ? 'border-orange-400 bg-orange-400/20 text-orange-50'
                    : 'border-orange-500/30 bg-transparent text-orange-100/40'
                }`}
              >
                {index < currentStep ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium whitespace-nowrap ${
                  index <= currentStep
                    ? 'text-orange-100'
                    : 'text-orange-100/40'
                }`}
              >
                {step.title}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 h-0.5 bg-orange-500/20">
                <motion.div
                  className="h-full bg-orange-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: index < currentStep ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile view - use compact variant */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-orange-100/60">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-xs text-orange-100/60">
            {steps[currentStep]?.title}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-orange-500/20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-300"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {/* Step dots below progress bar on mobile */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick || index > currentStep}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-4 bg-orange-400'
                  : index < currentStep
                  ? 'w-1.5 bg-orange-400/60'
                  : 'w-1.5 bg-orange-500/20'
              }`}
              aria-label={`Step ${index + 1}: ${step.title}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProgressIndicator
