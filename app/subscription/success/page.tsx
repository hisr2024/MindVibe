'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
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
  }

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
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-orange-50 mb-2">
            Welcome to {tierNames[tier] || 'Basic'}!
          </h1>
          <p className="text-sm text-orange-100/70 mb-6">
            Your subscription is now active. You have access to all {tierNames[tier] || 'Basic'} features.
          </p>

          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-6 text-left">
            <h2 className="font-semibold text-orange-50 mb-2">What's next?</h2>
            <ul className="space-y-2 text-sm text-orange-100/80">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Start chatting with KIAAN
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Explore your new features
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Check your subscription dashboard
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full">
                Start Using KIAAN
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" className="w-full">
                View Subscription
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
