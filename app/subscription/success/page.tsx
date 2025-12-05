'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, Badge, ConfettiAnimation } from '@/components/ui'
import { updateSubscription, type Subscription } from '@/hooks/useSubscription'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tier = searchParams.get('tier') || 'basic'
  const yearly = searchParams.get('yearly') === 'true'

  const tierNames: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    enterprise: 'Enterprise',
    pro: 'Pro',
    executive: 'Executive',
  }

  const tierOnboarding: Record<string, { title: string; items: string[] }> = {
    basic: {
      title: 'Get Started with Basic',
      items: [
        'Try guided breathing sessions',
        'Start your mood journaling practice',
        'Explore 75 monthly KIAAN questions',
        'Set up daily reminder notifications',
      ],
    },
    pro: {
      title: 'Explore Pro Features',
      items: [
        'Create your first encrypted journal entry',
        'Try the Ardha Reframing Assistant',
        'Explore the Viyog Detachment Coach',
        'Use 150 KIAAN questions this month',
      ],
    },
    premium: {
      title: 'Unlock Premium Power',
      items: [
        'Explore the Relationship Compass',
        'Try the Karma Reset Guide',
        'View your advanced mood analytics',
        'Enjoy 300 monthly KIAAN questions',
      ],
    },
    executive: {
      title: 'Executive Access Activated',
      items: [
        'Unlimited KIAAN conversations await',
        'Set up your API access for integrations',
        'Contact your dedicated support team',
        'Review your SLA guarantee details',
      ],
    },
    enterprise: {
      title: 'Enterprise Onboarding',
      items: [
        'Schedule your onboarding call with our team',
        'Set up team access and permissions',
        'Configure enterprise security settings',
        'Review your custom SLA terms',
      ],
    },
  }

  const onboarding = tierOnboarding[tier] || tierOnboarding.basic

  useEffect(() => {
    // Update subscription in localStorage (simulating successful checkout)
    // Generate a more unique ID to avoid collisions
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newSubscription: Subscription = {
      id: `sub_${uniqueId}`,
      tierId: tier,
      tierName: tierNames[tier] || 'Basic',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
      isYearly: yearly,
    }
    updateSubscription(newSubscription)
  }, [tier, yearly])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Confetti Animation */}
      <ConfettiAnimation duration={6000} numberOfPieces={250} />

      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <Badge variant="premium" className="mb-4">{tierNames[tier] || 'Basic'} Plan</Badge>

          <h1 className="text-2xl font-bold text-orange-50 mb-2">
            Welcome to {tierNames[tier] || 'Basic'}!
          </h1>
          <p className="text-sm text-orange-100/70 mb-6">
            Your subscription is now active. You have access to all {tierNames[tier] || 'Basic'} features.
          </p>

          {/* Usage Limits */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 mb-6 text-left">
            <h2 className="font-semibold text-emerald-50 mb-2">Your New Limits</h2>
            <div className="space-y-2 text-sm text-emerald-100/80">
              <div className="flex items-center justify-between">
                <span>KIAAN Questions</span>
                <span className="font-semibold">
                  {tier === 'executive' || tier === 'enterprise'
                    ? 'Unlimited'
                    : tier === 'premium'
                      ? '300/month'
                      : tier === 'pro'
                        ? '150/month'
                        : '75/month'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Billing</span>
                <span className="font-semibold">{yearly ? 'Yearly' : 'Monthly'}</span>
              </div>
            </div>
          </div>

          {/* Onboarding Checklist */}
          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-6 text-left">
            <h2 className="font-semibold text-orange-50 mb-3">{onboarding.title}</h2>
            <ul className="space-y-2 text-sm text-orange-100/80">
              {onboarding.items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded border border-orange-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs text-orange-400">{index + 1}</span>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/kiaan">
              <Button className="w-full">
                🚀 Start Using KIAAN
              </Button>
            </Link>
            <Link href="/subscription">
              <Button variant="outline" className="w-full">
                View Subscription Dashboard
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="w-full">
                Configure Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-orange-100">Loading...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}
