'use client'

/**
 * Dynamic Onboarding Step Page
 * Handles step-by-step onboarding flow with URL routing
 */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { ProfileSetupStep } from '@/components/onboarding/ProfileSetupStep'
import { PreferencesStep } from '@/components/onboarding/PreferencesStep'
import { PlanSelectionStep } from '@/components/onboarding/PlanSelectionStep'
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete'
import { Button } from '@/components/ui'
import { type PricingTier } from '@/components/pricing/PricingCard'

// Step configuration
const STEPS = ['welcome', 'profile', 'preferences', 'plan', 'complete'] as const
type StepId = (typeof STEPS)[number]

const STEP_TITLES = ['Welcome', 'Profile', 'Preferences', 'Plan', 'Complete']

// Pricing tiers for plan selection
const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with 20 KIAAN questions/month',
    monthlyPrice: 0,
    yearlyPrice: 0,
    kiaanQuota: 20,
    features: ['20 questions/month', 'Journal & mood tracking', 'Daily wisdom'],
    cta: 'Start Free',
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'More questions and extra features',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    kiaanQuota: 50,
    features: ['50 questions/month', 'All assistants', 'Email support'],
    cta: 'Go Basic',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full access to everything',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    kiaanQuota: 300,
    highlighted: true,
    badge: 'Best Value',
    features: ['300 questions/month', 'Advanced features', 'Priority support'],
    cta: 'Go Premium',
  },
]

// Local storage key for onboarding state
const ONBOARDING_STATE_KEY = 'mindvibe_onboarding_state'

interface OnboardingState {
  name: string
  bio: string
  timezone: string
  language: string
  goals: string[]
  moodFrequency: string
  notifications: boolean
  selectedPlan: string
}

const getInitialState = (): OnboardingState => {
  if (typeof window === 'undefined') {
    return {
      name: '',
      bio: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      goals: [],
      moodFrequency: 'daily',
      notifications: true,
      selectedPlan: 'free',
    }
  }

  try {
    const saved = localStorage.getItem(ONBOARDING_STATE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to parse onboarding state:', e)
  }

  return {
    name: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    goals: [],
    moodFrequency: 'daily',
    notifications: true,
    selectedPlan: 'free',
  }
}

export default function OnboardingStepPage() {
  const router = useRouter()
  const params = useParams()
  const stepParam = params.step as string

  // State management
  const [state, setState] = useState<OnboardingState>(getInitialState)
  const [isClient, setIsClient] = useState(false)

  // Get current step index
  const currentStepIndex = STEPS.indexOf(stepParam as StepId)
  const isValidStep = currentStepIndex !== -1

  // Client-side initialization
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard mount detection for hydration safety
    setIsClient(true)
    setState(getInitialState())
  }, [])

  // Auto-save state to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(state))
    }
  }, [state, isClient])

  // Redirect to first step if invalid
  useEffect(() => {
    if (!isValidStep && isClient) {
      router.replace('/onboarding/welcome')
    }
  }, [isValidStep, router, isClient])

  // Navigation handlers
  const goToStep = (step: number) => {
    if (step >= 0 && step < STEPS.length) {
      router.push(`/onboarding/${STEPS[step]}`)
    }
  }

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      goToStep(currentStepIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('mindvibe_onboarding_complete', 'true')
    router.push('/')
  }

  const handleComplete = () => {
    // Save profile
    const profile = {
      displayName: state.name || 'MindVibe User',
      email: 'user@mindvibe.life',
      bio: state.bio,
      timezone: state.timezone,
      language: state.language,
      goals: state.goals,
      plan: state.selectedPlan,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('mindvibe_profile', JSON.stringify(profile))
    localStorage.setItem('mindvibe_onboarding_complete', 'true')
    localStorage.setItem('mindvibe_preferences', JSON.stringify({
      goals: state.goals,
      moodFrequency: state.moodFrequency,
      notifications: state.notifications,
    }))
    
    // Clear temporary onboarding state
    localStorage.removeItem(ONBOARDING_STATE_KEY)
    
    // Redirect based on plan selection
    if (state.selectedPlan === 'free') {
      router.push('/')
    } else {
      router.push(`/pricing?highlight=${state.selectedPlan}`)
    }
  }

  const handleStartChat = () => {
    handleComplete()
    router.push('/kiaan/chat')
  }

  const handleGoToDashboard = () => {
    handleComplete()
    router.push('/dashboard')
  }

  // State update handlers
  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }))
    // Sync language selection with global LanguageProvider
    if (updates.language) {
      localStorage.setItem('preferredLocale', updates.language)
      document.documentElement.lang = updates.language
      window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale: updates.language } }))
    }
  }

  // Get current tier info for completion screen
  const selectedTier = pricingTiers.find(t => t.id === state.selectedPlan)

  // Render step content
  const renderStepContent = () => {
    switch (stepParam as StepId) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <WelcomeScreen />
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-orange-50 mb-2">Set Up Your Profile</h2>
              <p className="text-sm text-orange-100/70">Let&apos;s personalize your experience</p>
            </div>
            <ProfileSetupStep
              name={state.name}
              onNameChange={(name) => updateState({ name })}
              bio={state.bio}
              onBioChange={(bio) => updateState({ bio })}
            />
            {/* Timezone auto-detection */}
            <div className="max-w-md mx-auto space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-orange-50">
                  Timezone
                </label>
                <select
                  value={state.timezone}
                  onChange={(e) => updateState({ timezone: e.target.value })}
                  className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
                >
                  <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                    {Intl.DateTimeFormat().resolvedOptions().timeZone} (Auto-detected)
                  </option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
              
              {/* Language selector */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-orange-50">
                  Language
                </label>
                <select
                  value={state.language}
                  onChange={(e) => updateState({ language: e.target.value })}
                  className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="te">తెలుగు (Telugu)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="gu">ગુજરાતી (Gujarati)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="ml">മലയാളം (Malayalam)</option>
                  <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="sa">संस्कृत (Sanskrit)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="pt">Português (Portuguese)</option>
                  <option value="ja">日本語 (Japanese)</option>
                  <option value="zh-CN">简体中文 (Chinese)</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-orange-50 mb-2">What brings you here?</h2>
              <p className="text-sm text-orange-100/70">Help us understand your wellness goals</p>
            </div>
            <PreferencesStep
              selectedGoals={state.goals}
              onGoalsChange={(goals) => updateState({ goals })}
            />
            {/* Additional preferences */}
            <div className="max-w-md mx-auto space-y-4 mt-6 pt-6 border-t border-orange-500/10">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-orange-50">
                  Mood Tracking Frequency
                </label>
                <select
                  value={state.moodFrequency}
                  onChange={(e) => updateState({ moodFrequency: e.target.value })}
                  className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
                >
                  <option value="daily">Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-50">Daily Reminders</p>
                  <p className="text-xs text-orange-100/50">Get gentle nudges for journaling</p>
                </div>
                <button
                  onClick={() => updateState({ notifications: !state.notifications })}
                  className={`relative w-12 h-6 rounded-full transition ${
                    state.notifications
                      ? 'bg-orange-500/30 border border-orange-400'
                      : 'bg-orange-500/10 border border-orange-500/20'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300"
                    animate={{ left: state.notifications ? '1.5rem' : '0.125rem' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </div>
        )

      case 'plan':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-orange-50 mb-2">Choose Your Plan</h2>
              <p className="text-sm text-orange-100/70">Start free or unlock more features</p>
            </div>
            <PlanSelectionStep
              tiers={pricingTiers}
              selectedTier={state.selectedPlan}
              onSelectTier={(plan) => updateState({ selectedPlan: plan })}
            />
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-orange-50 mb-2">You&apos;re All Set!</h2>
              <p className="text-sm text-orange-100/70">Ready to begin your mindful journey</p>
            </div>
            <OnboardingComplete
              userName={state.name}
              selectedPlan={selectedTier?.name || 'Free'}
              kiaanQuota={selectedTier?.kiaanQuota || 10}
              onStartChat={handleStartChat}
              onGoToDashboard={handleGoToDashboard}
            />
          </div>
        )

      default:
        return null
    }
  }

  if (!isClient || !isValidStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-orange-100/50">Loading...</div>
      </div>
    )
  }

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEPS.length - 1

  return (
    <OnboardingLayout
      currentStep={currentStepIndex}
      totalSteps={STEPS.length}
      stepTitles={STEP_TITLES}
      onStepClick={(step) => step < currentStepIndex && goToStep(step)}
      onSkip={handleSkip}
      showSkip={!isLastStep}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stepParam}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {!isLastStep && (
        <div className="flex gap-3 mt-8">
          {!isFirstStep && (
            <Button onClick={handleBack} variant="outline" className="flex-1">
              Back
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1">
            Continue
          </Button>
        </div>
      )}

      {isLastStep && (
        <div className="flex gap-3 mt-8">
          <Button onClick={handleBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button onClick={handleComplete} className="flex-1">
            Complete Setup
          </Button>
        </div>
      )}
    </OnboardingLayout>
  )
}
