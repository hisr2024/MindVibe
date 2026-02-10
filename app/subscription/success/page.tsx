'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { updateSubscription, type Subscription } from '@/hooks/useSubscription'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tier = searchParams.get('tier') || 'basic'
  const yearly = searchParams.get('yearly') === 'true'
  const sessionId = searchParams.get('session_id')
  const [validating, setValidating] = useState(true)

  const tierNames: Record<string, string> = {
    basic: 'Basic',
    premium: 'Premium',
    enterprise: 'Enterprise',
  }

  useEffect(() => {
    async function validateSubscription() {
      try {
        // Fetch the real subscription from the server to validate the checkout
        const response = await fetch('/api/subscriptions/current', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const subscription: Subscription = {
            id: String(data.id ?? `sub_${tier}`),
            tierId: data.plan?.tier ?? tier,
            tierName: data.plan?.name ?? tierNames[tier] ?? 'Basic',
            status: (data.status as Subscription['status']) ?? 'active',
            currentPeriodEnd: data.current_period_end
              ? new Date(data.current_period_end).toISOString()
              : new Date(Date.now() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
            isYearly: yearly,
          }
          updateSubscription(subscription)
        }
      } catch (err) {
        console.warn('Could not validate subscription from server, using tier from URL', err)
      } finally {
        setValidating(false)
      }
    }

    validateSubscription()
  }, [tier, yearly, sessionId])

  if (validating) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
          <p className="text-orange-100">Confirming your subscription...</p>
        </div>
      </main>
    )
  }

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
