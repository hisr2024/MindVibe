import OnboardingClient from './OnboardingClient'

export const metadata = {
  title: 'Onboarding | MindVibe',
  description: 'Guided onboarding with privacy, opt-ins, reduced motion, and demo data controls.',
}

export default function OnboardingPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 pb-16 lg:px-6">
      <OnboardingClient />
    </main>
  )
}
