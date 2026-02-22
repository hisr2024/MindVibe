/**
 * OnboardingContainer Component
 * Main container with step navigation, progress tracking, and animations
 */

'use client'

import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'

export interface OnboardingStepConfig {
  id: string
  title: string
  description?: string
  content: ReactNode
  isOptional?: boolean
  canSkip?: boolean
}

interface OnboardingContainerProps {
  steps: OnboardingStepConfig[]
  currentStep: number
  onStepChange: (step: number) => void
  onComplete: () => void
  onSkip?: () => void
  isLoading?: boolean
  isSaving?: boolean
  canProceed?: boolean
  className?: string
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export function OnboardingContainer({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onSkip,
  isLoading: _isLoading = false,
  isSaving = false,
  canProceed = true,
  className = '',
}: OnboardingContainerProps) {
  const [direction, setDirection] = useState(0)

  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setDirection(1)
      onStepChange(currentStep + 1)
    }
  }

  const handleBack = () => {
    setDirection(-1)
    onStepChange(Math.max(0, currentStep - 1))
  }

  const handleStepClick = (index: number) => {
    if (index < currentStep) {
      setDirection(-1)
      onStepChange(index)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-orange-100/60">
            Step {currentStep + 1} of {steps.length}
          </p>
          {onSkip && !isLastStep && (
            <button
              onClick={onSkip}
              className="text-xs text-orange-100/50 hover:text-orange-100/80 transition"
            >
              Skip onboarding
            </button>
          )}
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

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, index) => (
          <button
            key={s.id}
            onClick={() => handleStepClick(index)}
            disabled={index > currentStep}
            className={`h-2 rounded-full transition-all duration-300 ${
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
        <motion.h2
          key={`title-${currentStep}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-orange-50 mb-2"
        >
          {step.title}
        </motion.h2>
        {step.description && (
          <motion.p
            key={`desc-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-orange-100/70"
          >
            {step.description}
          </motion.p>
        )}
      </div>

      {/* Animated content */}
      <div className="relative overflow-hidden mb-8 min-h-[200px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            {step.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {!isFirstStep && (
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1"
            disabled={isSaving}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          className="flex-1"
          disabled={!canProceed || isSaving}
          loading={isSaving}
        >
          {isLastStep ? 'Complete' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

export default OnboardingContainer
