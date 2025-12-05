'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FadeIn, Card, CardContent, Button, Badge } from '@/components/ui'
import { PlanOverview, UsageChart, BillingHistory, PlanComparison, CancelFlow } from '@/components/subscription'
import { useSubscription, updateSubscription, type Subscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'

export default function SubscriptionPage() {
  const router = useRouter()
  const { subscription, loading, refetch } = useSubscription()
  const [isYearly, setIsYearly] = useState(false)
  const [showReferral, setShowReferral] = useState(false)

  // Mock usage data
  const usage = {
    kiaanChats: {
      used: subscription?.tierId === 'free' ? 8 : 45,
      limit: subscription?.tierId === 'free' ? 20 : subscription?.tierId === 'basic' ? 75 : 150,
    },
    features: ['mood_tracking', 'daily_wisdom', 'breathing_exercises'],
  }

  // Mock payment method
  const paymentMethod = subscription?.tierId !== 'free' ? {
    brand: 'Visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2025,
  } : undefined

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      // Downgrade to free
      const newSubscription: Subscription = {
        id: 'free-default',
        tierId: 'free',
        tierName: 'Free',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        isYearly: false,
      }
      updateSubscription(newSubscription)
      refetch()
    } else {
      // Redirect to pricing/checkout
      router.push(`/pricing?tier=${planId}&yearly=${isYearly}`)
    }
  }

  const handleCancelSubscription = (reason: string, feedback?: string) => {
    if (!subscription) return

    // Mark subscription as canceling at period end
    const updated: Subscription = {
      ...subscription,
      cancelAtPeriodEnd: true,
    }
    updateSubscription(updated)
    refetch()

    // In production, this would send the reason/feedback to the server
    console.log('Cancellation reason:', reason, feedback)
  }

  const handleKeepSubscription = () => {
    // User decided to keep subscription (accepted offer)
    console.log('User kept subscription')
  }

  const handleReactivate = () => {
    if (!subscription) return

    const updated: Subscription = {
      ...subscription,
      cancelAtPeriodEnd: false,
    }
    updateSubscription(updated)
    refetch()
  }

  // Generate referral code
  const referralCode = 'MINDVIBE' + Math.random().toString(36).substring(2, 8).toUpperCase()

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-orange-500/10" />
          <div className="h-64 rounded-3xl bg-orange-500/10" />
          <div className="h-48 rounded-3xl bg-orange-500/10" />
        </div>
      </main>
    )
  }

  if (!subscription) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <p className="text-orange-100/70">Unable to load subscription data</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-50 mb-2">Subscription</h1>
          <p className="text-orange-100/70">Manage your plan, billing, and usage</p>
        </div>
      </FadeIn>

      {/* Cancellation Notice */}
      {subscription.cancelAtPeriodEnd && (
        <FadeIn delay={0.05}>
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-50">Your subscription is set to cancel</p>
                <p className="text-sm text-amber-200/70">
                  You'll have access until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleReactivate}>
                Reactivate
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Plan Overview & Usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Plan Overview */}
          <FadeIn delay={0.1}>
            <PlanOverview subscription={subscription} usage={usage} />
          </FadeIn>

          {/* Usage Analytics */}
          <FadeIn delay={0.15}>
            <UsageChart />
          </FadeIn>

          {/* Plan Comparison */}
          <FadeIn delay={0.2}>
            <PlanComparison
              currentPlanId={subscription.tierId}
              isYearly={isYearly}
              onToggleBilling={setIsYearly}
              onSelectPlan={handleSelectPlan}
            />
          </FadeIn>
        </div>

        {/* Right Column - Billing & Actions */}
        <div className="space-y-6">
          {/* Billing History */}
          <FadeIn delay={0.25}>
            <BillingHistory
              paymentMethod={paymentMethod}
              nextBillingDate={subscription.tierId !== 'free' ? subscription.currentPeriodEnd : undefined}
            />
          </FadeIn>

          {/* Referral Program */}
          <FadeIn delay={0.3}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-orange-50 mb-3">Referral Program</h3>
              <p className="text-sm text-orange-100/70 mb-4">
                Share MindVibe with friends and earn rewards!
              </p>
              
              <div className="rounded-xl bg-black/30 p-4 mb-4">
                <p className="text-xs text-orange-100/60 mb-1">Your Referral Code</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-orange-400">{referralCode}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(referralCode)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const text = `Join me on MindVibe for mindful AI guidance! Use code ${referralCode} for a bonus.`
                    if (navigator.share) {
                      navigator.share({ text })
                    } else {
                      navigator.clipboard.writeText(text)
                    }
                  }}
                >
                  Share
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-orange-500/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-100/70">Referrals</span>
                  <span className="font-semibold text-orange-50">0</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-orange-100/70">Rewards Earned</span>
                  <span className="font-semibold text-orange-50">$0.00</span>
                </div>
              </div>
            </Card>
          </FadeIn>

          {/* Manage Subscription Actions */}
          <FadeIn delay={0.35}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-orange-50 mb-4">Manage Subscription</h3>
              <div className="space-y-3">
                {subscription.tierId === 'free' ? (
                  <Link href="/pricing" className="block">
                    <Button variant="primary" className="w-full">
                      Upgrade Now
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/pricing" className="block">
                      <Button variant="secondary" className="w-full">
                        Change Plan
                      </Button>
                    </Link>
                    {!subscription.cancelAtPeriodEnd && (
                      <CancelFlow
                        onCancel={handleCancelSubscription}
                        onKeepSubscription={handleKeepSubscription}
                        className="w-full"
                      />
                    )}
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-orange-500/10">
                <Link href="/contact" className="text-sm text-orange-100/70 hover:text-orange-50">
                  Need help? Contact Support →
                </Link>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </main>
  )
}
