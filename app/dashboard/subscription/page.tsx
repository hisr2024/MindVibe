'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CurrentPlanCard } from '@/components/dashboard/CurrentPlanCard'
import { KiaanQuotaCard } from '@/components/dashboard/KiaanQuotaCard'
import { UsageCard } from '@/components/dashboard/UsageCard'
import { UpgradePrompt } from '@/components/cta/UpgradePrompt'
import { CancelSubscriptionModal } from '@/components/modals'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { useSubscription, updateSubscription } from '@/hooks/useSubscription'
import { useKiaanQuota } from '@/hooks/useKiaanQuota'
import { KiaanLogo } from '@/src/components/KiaanLogo'

export default function SubscriptionDashboardPage() {
  const router = useRouter()
  const { subscription, loading, refetch } = useSubscription()
  const quota = useKiaanQuota(subscription?.tierId ?? 'free')
  const [showCancelModal, setShowCancelModal] = useState(false)

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    
    // Update subscription to mark as canceling at period end
    const updated = {
      ...subscription,
      cancelAtPeriodEnd: true,
    }
    updateSubscription(updated)
    await refetch()
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg bg-orange-500/10" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 rounded-3xl bg-orange-500/10" />
            <div className="h-64 rounded-3xl bg-orange-500/10" />
          </div>
        </div>
      </main>
    )
  }

  if (!subscription) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-xl font-semibold text-orange-50 mb-4">No Active Subscription</h1>
            <p className="text-sm text-orange-100/70 mb-6">Get started with a plan to unlock KIAAN's full potential.</p>
            <Button onClick={handleUpgrade}>View Plans</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const usageItems = [
    { name: 'Journal Entries', used: 12, limit: 'unlimited' as const },
    { name: 'Mood Check-ins', used: 28, limit: 'unlimited' as const },
    { name: 'Breathing Sessions', used: 8, limit: 'unlimited' as const },
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-6 shadow-[0_18px_70px_rgba(46,160,255,0.14)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <KiaanLogo size="md" className="shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-orange-50 mb-1">Subscription</h1>
          <p className="text-orange-100/75">Manage your plan and track your usage with the MindVibe Companion by your side.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Current Plan */}
        <div className="lg:col-span-2">
          <CurrentPlanCard
            subscription={subscription}
            onManage={() => setShowCancelModal(true)}
            onUpgrade={handleUpgrade}
          />
        </div>

        {/* KIAAN Quota */}
        <KiaanQuotaCard
          used={quota.used}
          limit={quota.limit}
          resetDate={quota.resetDate}
          isUnlimited={quota.limit === -1}
          onUpgrade={subscription.tierId === 'free' ? handleUpgrade : undefined}
        />
      </div>

      {/* Upgrade Prompt for Free Users */}
      {subscription.tierId === 'free' && (
        <UpgradePrompt
          variant="banner"
          title="Unlock More Features"
          description="Upgrade to Basic or Premium for more KIAAN questions and advanced features."
          ctaText="View Plans"
          ctaLink="/pricing"
          className="mb-8"
        />
      )}

      {/* Usage Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <UsageCard items={usageItems} />

        {/* Billing History */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-orange-50 mb-4">Billing History</h3>
            {subscription.tierId === 'free' ? (
              <p className="text-sm text-orange-100/60">
                No billing history for free plan.
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  { date: new Date(), amount: subscription.isYearly ? 189 : 19, status: 'paid' },
                ].map((invoice, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-orange-500/10 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-orange-50">
                        {invoice.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-orange-100/60">{subscription.tierName} Plan</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-orange-50">${invoice.amount}</span>
                      <Badge variant="success" size="sm">Paid</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-orange-50 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleUpgrade} variant="outline" size="sm">
              Change Plan
            </Button>
            {subscription.tierId !== 'free' && (
              <Button onClick={() => setShowCancelModal(true)} variant="ghost" size="sm">
                Cancel Subscription
              </Button>
            )}
            <Button onClick={() => router.push('/settings')} variant="ghost" size="sm">
              Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Modal */}
      {subscription.tierId !== 'free' && (
        <CancelSubscriptionModal
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          planName={subscription.tierName}
          endDate={new Date(subscription.currentPeriodEnd)}
          onConfirm={handleCancelSubscription}
        />
      )}
    </main>
  )
}
