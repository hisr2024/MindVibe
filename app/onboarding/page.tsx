'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { ProfileSetupStep } from '@/components/onboarding/ProfileSetupStep'
import { PreferencesStep } from '@/components/onboarding/PreferencesStep'
import { PlanSelectionStep } from '@/components/onboarding/PlanSelectionStep'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete'
import { Card, CardContent } from '@/components/ui'
import { type PricingTier } from '@/components/pricing/PricingCard'

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

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState('free')

  const handleComplete = () => {
    // Save profile
    const profile = {
      displayName: name || 'MindVibe User',
      email: 'user@mindvibe.life',
      bio,
      goals,
      plan: selectedPlan,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('mindvibe_profile', JSON.stringify(profile))
    localStorage.setItem('mindvibe_onboarding_complete', 'true')
    localStorage.setItem('mindvibe_preferences', JSON.stringify({ goals }))
    
    // Redirect based on plan selection
    if (selectedPlan === 'free') {
      router.push('/')
    } else {
      router.push(`/pricing?highlight=${selectedPlan}`)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('mindvibe_onboarding_complete', 'true')
    router.push('/')
  }

  const handleStartChat = () => {
    handleComplete()
    router.push('/kiaan/chat')
  }

  const handleGoToDashboard = () => {
    handleComplete()
    router.push('/dashboard')
  }

  const selectedTier = pricingTiers.find(t => t.id === selectedPlan)

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to MindVibe',
      description: 'Your calm, privacy-first mental health companion',
      content: <WelcomeScreen />,
    },
    {
      id: 'profile',
      title: 'Set Up Your Profile',
      description: "Let's personalize your experience",
      content: (
        <ProfileSetupStep
          name={name}
          onNameChange={setName}
          bio={bio}
          onBioChange={setBio}
        />
      ),
    },
    {
      id: 'preferences',
      title: 'What brings you here?',
      description: 'Help us understand your wellness goals',
      content: (
        <PreferencesStep
          selectedGoals={goals}
          onGoalsChange={setGoals}
        />
      ),
    },
    {
      id: 'plan',
      title: 'Choose Your Plan',
      description: 'Start free or unlock more features',
      content: (
        <PlanSelectionStep
          tiers={pricingTiers}
          selectedTier={selectedPlan}
          onSelectTier={setSelectedPlan}
        />
      ),
    },
    {
      id: 'complete',
      title: "You're All Set!",
      description: 'Ready to begin your mindful journey',
      content: (
        <OnboardingComplete
          userName={name}
          selectedPlan={selectedTier?.name || 'Free'}
          kiaanQuota={selectedTier?.kiaanQuota || 10}
          onStartChat={handleStartChat}
          onGoToDashboard={handleGoToDashboard}
        />
      ),
    },
  ]

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card variant="elevated" className="w-full max-w-2xl">
        <CardContent className="py-8">
          <OnboardingWizard
            steps={steps}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        </CardContent>
      </Card>
    </main>
  )
}
