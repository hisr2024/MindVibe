/**
 * OnboardingLayout Component
 * Wrapper layout for onboarding flow with progress indicator and consistent styling
 */

'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ProgressIndicator } from './ProgressIndicator'
import { Card, CardContent } from '@/components/ui'

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps?: number
  stepTitles?: string[]
  onStepClick?: (step: number) => void
  onSkip?: () => void
  showSkip?: boolean
  className?: string
}

const DEFAULT_STEP_TITLES = [
  'Welcome',
  'Profile',
  'Preferences',
  'Plan',
  'Complete',
]

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps = 5,
  stepTitles = DEFAULT_STEP_TITLES,
  onStepClick,
  onSkip,
  showSkip = true,
  className = '',
}: OnboardingLayoutProps) {
  const steps = stepTitles.slice(0, totalSteps).map((title, index) => ({
    id: `step-${index + 1}`,
    title,
    isCompleted: index < currentStep,
    isCurrent: index === currentStep,
  }))

  return (
    <main className={`min-h-screen flex items-center justify-center px-4 py-12 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card variant="elevated">
          <CardContent className="py-8">
            {/* Header with progress and skip */}
            <div className="mb-8">
              <ProgressIndicator
                steps={steps}
                currentStep={currentStep}
                onStepClick={onStepClick}
                variant="default"
              />
              
              {showSkip && onSkip && currentStep < totalSteps - 1 && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={onSkip}
                    className="text-xs text-orange-100/50 hover:text-orange-100/80 transition"
                  >
                    Skip onboarding
                  </button>
                </div>
              )}
            </div>

            {/* Step content */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </CardContent>
        </Card>

        {/* Footer branding */}
        <p className="text-center text-xs text-orange-100/30 mt-6">
          MindVibe — Your calm, privacy-first mental health companion
        </p>
      </motion.div>
    </main>
  )
}

export default OnboardingLayout
