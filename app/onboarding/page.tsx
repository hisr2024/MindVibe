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
    name: 'Seeker',
    description: 'Begin your spiritual journey with 5 KIAAN questions/month',
    monthlyPrice: 0,
    yearlyPrice: 0,
    kiaanQuota: 5,
    features: ['5 questions/month', 'Mood tracking', 'Daily wisdom', '1 Wisdom Journey'],
    cta: 'Start Free',
  },
  {
    id: 'bhakta',
    name: 'Bhakta',
    description: 'More questions and encrypted journal for devoted seekers',
    monthlyPrice: 6.99,
    yearlyPrice: 47.99,
    kiaanQuota: 50,
    features: ['50 questions/month', 'Encrypted journal', '3 Wisdom Journeys'],
    cta: 'Go Bhakta',
  },
  {
    id: 'sadhak',
    name: 'Sadhak',
    description: 'Full access to all features with 300 KIAAN questions',
    monthlyPrice: 12.99,
    yearlyPrice: 89.99,
    kiaanQuota: 300,
    highlighted: true,
    badge: 'Most Popular',
    features: ['300 questions/month', 'Voice Companion', 'All assistants', 'Priority support'],
    cta: 'Go Sadhak',
  },
  {
    id: 'siddha',
    name: 'Siddha',
    description: 'Unlimited KIAAN with dedicated support',
    monthlyPrice: 22.99,
    yearlyPrice: 169.99,
    kiaanQuota: -1,
    badge: 'Unlimited',
    features: ['Unlimited questions', 'All Sadhak features', 'Dedicated support', 'Team features'],
    cta: 'Go Siddha',
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
      displayName: name || 'Sakha User',
      email: 'user@kiaanverse.com',
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
      title: 'Welcome to Sakha',
      description: 'Your calm, privacy-first spiritual companion',
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
