'use client'

import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui'

export interface OnboardingStep {
  id: string
  title: string
  description?: string
  content: ReactNode
  isOptional?: boolean
}

interface OnboardingWizardProps {
  steps: OnboardingStep[]
  onComplete: (data: Record<string, unknown>) => void
  onSkip?: () => void
  className?: string
}

export function OnboardingWizard({
  steps,
  onComplete,
  onSkip,
  className = '',
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [stepData, setStepData] = useState<Record<string, unknown>>({})

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (isLastStep) {
      onComplete(stepData)
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  const _updateStepData = (key: string, value: unknown) => {
    setStepData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-orange-100/60">
            Step {currentStep + 1} of {steps.length}
          </p>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-orange-100/50 hover:text-orange-100/80 transition"
            >
              Skip onboarding
            </button>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-orange-500/20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, index) => (
          <button
            key={s.id}
            onClick={() => index < currentStep && setCurrentStep(index)}
            disabled={index > currentStep}
            className={`h-2 rounded-full transition-all ${
              index === currentStep
                ? 'w-8 bg-orange-400'
                : index < currentStep
                ? 'w-2 bg-orange-400/60 cursor-pointer hover:bg-orange-400/80'
                : 'w-2 bg-orange-500/20'
            }`}
            aria-label={`Go to step ${index + 1}: ${s.title}`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-orange-50 mb-2">{step.title}</h2>
        {step.description && (
          <p className="text-sm text-orange-100/70">{step.description}</p>
        )}
      </div>

      <div className="mb-8">
        {step.content}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {!isFirstStep && (
          <Button onClick={handleBack} variant="outline" className="flex-1">
            Back
          </Button>
        )}
        <Button onClick={handleNext} className="flex-1">
          {isLastStep ? 'Complete' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

export default OnboardingWizard
