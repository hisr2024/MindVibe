/**
 * useOnboarding Hook
 * Manage onboarding state, validation, and persistence
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  OnboardingState,
  OnboardingStepId,
  ProfileData,
  PreferencesData,
  SubscriptionData,
  OnboardingValidationErrors,
} from '@/types/onboarding.types'
import {
  DEFAULT_ONBOARDING_STATE,
  DEFAULT_PROFILE_DATA,
  DEFAULT_PREFERENCES_DATA,
  DEFAULT_SUBSCRIPTION_DATA,
} from '@/types/onboarding.types'
import {
  saveOnboardingProgress,
  getOnboardingProgress,
  completeOnboarding,
  isOnboardingComplete as checkOnboardingComplete,
} from '@/services/onboardingService'

const TOTAL_STEPS = 5
const STEP_IDS: OnboardingStepId[] = [
  'welcome',
  'profile',
  'preferences',
  'subscription',
  'complete',
]

interface UseOnboardingResult {
  // State
  state: OnboardingState
  currentStep: number
  currentStepId: OnboardingStepId
  isFirstStep: boolean
  isLastStep: boolean
  progress: number
  isComplete: boolean
  isLoading: boolean
  isSaving: boolean
  errors: OnboardingValidationErrors

  // Profile actions
  updateProfile: (data: Partial<ProfileData>) => void
  
  // Preferences actions
  updatePreferences: (data: Partial<PreferencesData>) => void
  
  // Subscription actions
  updateSubscription: (data: Partial<SubscriptionData>) => void

  // Navigation
  goToStep: (step: number) => void
  nextStep: () => Promise<boolean>
  previousStep: () => void
  
  // Validation
  validateCurrentStep: () => boolean
  
  // Completion
  completeOnboardingFlow: () => Promise<boolean>
  
  // Reset
  resetOnboarding: () => void
}

export function useOnboarding(userId?: string): UseOnboardingResult {
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<OnboardingValidationErrors>({})

  // Derived state
  const currentStep = state.currentStep
  const currentStepId = STEP_IDS[currentStep] || 'welcome'
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOTAL_STEPS - 1
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100
  const isComplete = state.isComplete

  // Load saved progress on mount
  useEffect(() => {
    async function loadProgress() {
      setIsLoading(true)
      try {
        const progress = await getOnboardingProgress()
        if (progress?.data) {
          setState((prev) => ({
            ...prev,
            ...progress.data,
            profile: { ...prev.profile, ...progress.data.profile },
            preferences: { ...prev.preferences, ...progress.data.preferences },
            subscription: { ...prev.subscription, ...progress.data.subscription },
          }))
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProgress()
  }, [])

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (isLoading) return

    const timeoutId = setTimeout(() => {
      saveOnboardingProgress(state)
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [state, isLoading])

  // Update profile
  const updateProfile = useCallback((data: Partial<ProfileData>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...data },
    }))
    // Clear profile errors
    setErrors((prev) => ({ ...prev, profile: undefined }))
  }, [])

  // Update preferences
  const updatePreferences = useCallback((data: Partial<PreferencesData>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...data },
    }))
    setErrors((prev) => ({ ...prev, preferences: undefined }))
  }, [])

  // Update subscription
  const updateSubscription = useCallback((data: Partial<SubscriptionData>) => {
    setState((prev) => ({
      ...prev,
      subscription: { ...prev.subscription, ...data },
    }))
    setErrors((prev) => ({ ...prev, subscription: undefined }))
  }, [])

  // Validate profile step
  const validateProfile = useCallback((): boolean => {
    const profileErrors: Partial<Record<keyof ProfileData, string>> = {}

    if (!state.profile.displayName.trim()) {
      profileErrors.displayName = 'Please enter your name'
    }

    if (Object.keys(profileErrors).length > 0) {
      setErrors((prev) => ({ ...prev, profile: profileErrors }))
      return false
    }

    return true
  }, [state.profile])

  // Validate preferences step
  const validatePreferences = useCallback((): boolean => {
    // Preferences are optional, so always valid
    return true
  }, [])

  // Validate subscription step
  const validateSubscription = useCallback((): boolean => {
    // Subscription selection is always valid (defaults to free)
    return true
  }, [])

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    switch (currentStepId) {
      case 'welcome':
        return true
      case 'profile':
        return validateProfile()
      case 'preferences':
        return validatePreferences()
      case 'subscription':
        return validateSubscription()
      case 'complete':
        return true
      default:
        return true
    }
  }, [currentStepId, validateProfile, validatePreferences, validateSubscription])

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS && step <= currentStep + 1) {
      setState((prev) => ({ ...prev, currentStep: step }))
    }
  }, [currentStep])

  // Go to next step
  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!validateCurrentStep()) {
      return false
    }

    if (isLastStep) {
      return true
    }

    setIsSaving(true)
    try {
      const newStep = Math.min(currentStep + 1, TOTAL_STEPS - 1)
      setState((prev) => ({ ...prev, currentStep: newStep }))
      await saveOnboardingProgress({ ...state, currentStep: newStep })
      return true
    } catch (error) {
      console.error('Failed to save progress:', error)
      return true // Still allow navigation even if save fails
    } finally {
      setIsSaving(false)
    }
  }, [currentStep, isLastStep, validateCurrentStep, state])

  // Go to previous step
  const previousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }))
  }, [])

  // Complete onboarding
  const completeOnboardingFlow = useCallback(async (): Promise<boolean> => {
    setIsSaving(true)
    try {
      const result = await completeOnboarding(state)
      if (result.success) {
        setState((prev) => ({
          ...prev,
          isComplete: true,
          completedAt: new Date().toISOString(),
        }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [state])

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setState({
      ...DEFAULT_ONBOARDING_STATE,
      startedAt: new Date().toISOString(),
    })
    setErrors({})
  }, [])

  return {
    state,
    currentStep,
    currentStepId,
    isFirstStep,
    isLastStep,
    progress,
    isComplete,
    isLoading,
    isSaving,
    errors,
    updateProfile,
    updatePreferences,
    updateSubscription,
    goToStep,
    nextStep,
    previousStep,
    validateCurrentStep,
    completeOnboardingFlow,
    resetOnboarding,
  }
}

/**
 * Check if onboarding is complete (static helper)
 */
export function useIsOnboardingComplete(): boolean {
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setIsComplete(checkOnboardingComplete())
  }, [])

  return isComplete
}

export default useOnboarding
