'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { ProfileSetupStep } from '@/components/onboarding/ProfileSetupStep'
import { PreferencesStep } from '@/components/onboarding/PreferencesStep'
import { PlanSelectionStep } from '@/components/onboarding/PlanSelectionStep'
import { Card, CardContent } from '@/components/ui'
import { type PricingTier } from '@/components/pricing/PricingCard'

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with 10 KIAAN questions/month',
    monthlyPrice: 0,
    yearlyPrice: 0,
    kiaanQuota: 10,
    features: ['10 questions/month', 'Journal & mood tracking', 'Daily wisdom'],
    cta: 'Start Free',
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'More questions and extra features',
    monthlyPrice: 9,
    yearlyPrice: 89,
    kiaanQuota: 50,
    features: ['50 questions/month', 'All assistants', 'Email support'],
    cta: 'Go Basic',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full access to everything',
    monthlyPrice: 19,
    yearlyPrice: 189,
    kiaanQuota: 200,
    highlighted: true,
    badge: 'Best Value',
    features: ['200 questions/month', 'Advanced features', 'Priority support'],
    cta: 'Go Premium',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [goals, setGoals] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState('free')

  const handleComplete = (data: Record<string, unknown>) => {
    // Save profile
    const profile = {
      name: name || 'MindVibe User',
      email: 'user@mindvibe.app',
      bio,
      goals,
      plan: selectedPlan,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('mindvibe_profile', JSON.stringify(profile))
    localStorage.setItem('mindvibe_onboarding_complete', 'true')
    
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

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to MindVibe',
      description: 'Your calm, privacy-first mental health companion',
      content: (
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto mb-6 h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 flex items-center justify-center text-4xl font-bold text-slate-900">
            MV
          </div>
          <p className="text-sm text-orange-100/70 mb-6">
            KIAAN is here to offer gentle, Gita-inspired guidance for your mental wellness journey.
            Your conversations and journal entries stay private, encrypted on your device.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '🧘', label: 'Calm Guidance' },
              { icon: '📔', label: 'Private Journal' },
              { icon: '🔒', label: 'Fully Encrypted' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs text-orange-100/80">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
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
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm text-orange-100/70 mb-6">
            {name ? `Welcome, ${name}!` : 'Welcome!'} Your profile is ready. Start a conversation with KIAAN,
            explore your journal, or try one of our guided exercises.
          </p>
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
            <p className="text-xs text-orange-100/60 mb-2">Your selected plan:</p>
            <p className="text-lg font-semibold text-orange-50">
              {pricingTiers.find(t => t.id === selectedPlan)?.name || 'Free'}
            </p>
            <p className="text-xs text-orange-100/60 mt-1">
              {selectedPlan === 'free'
                ? '10 KIAAN questions per month'
                : `${pricingTiers.find(t => t.id === selectedPlan)?.kiaanQuota} questions per month`}
            </p>
          </div>
        </div>
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
