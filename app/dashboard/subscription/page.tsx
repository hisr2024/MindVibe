'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CurrentPlanCard } from '@/components/dashboard/CurrentPlanCard'
import { KiaanQuotaCard } from '@/components/dashboard/KiaanQuotaCard'
import { UsageCard } from '@/components/dashboard/UsageCard'
import { UpgradePrompt } from '@/components/cta/UpgradePrompt'
import { CancelSubscriptionModal } from '@/components/modals'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { useSubscription, cancelSubscription } from '@/hooks/useSubscription'
import { useKiaanQuota } from '@/hooks/useKiaanQuota'
import { KiaanLogo } from '@/src/components/KiaanLogo'
import { apiFetch } from '@/lib/api'

interface RecentPayment {
  id: number
  payment_provider: string
  amount: string | number
  currency: string
  status: string
  description: string | null
  created_at: string
}

const PROVIDER_LABELS: Record<string, string> = {
  stripe_card: 'Card',
  stripe_paypal: 'PayPal',
  razorpay_upi: 'UPI',
  free: 'Free',
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  succeeded: 'success',
  pending: 'warning',
  failed: 'danger',
  refunded: 'info',
}

function formatPaymentAmount(amount: string | number, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbols: Record<string, string> = { usd: '$', eur: '\u20AC', inr: '\u20B9' }
  const symbol = symbols[currency.toLowerCase()] ?? `${currency.toUpperCase()} `
  return `${symbol}${num.toFixed(2)}`
}

export default function SubscriptionDashboardPage() {
  const router = useRouter()
  const { subscription, loading, refetch } = useSubscription()
  const quota = useKiaanQuota(subscription?.tierId ?? 'free')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  const fetchRecentPayments = useCallback(async () => {
    try {
      const response = await apiFetch('/api/subscriptions/payments?page=1&page_size=5', {
        method: 'GET',
      })
      if (response.ok) {
        const data = await response.json()
        setRecentPayments(data.payments ?? [])
      }
    } catch {
      // Silently fail — billing history is non-critical
    } finally {
      setPaymentsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecentPayments()
  }, [fetchRecentPayments])

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    await cancelSubscription()
    // Refresh to get latest state from backend/cache
    await refetch()
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 rounded-lg bg-[#d4a44c]/10" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 rounded-3xl bg-[#d4a44c]/10" />
            <div className="h-64 rounded-3xl bg-[#d4a44c]/10" />
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
            <h1 className="text-xl font-semibold text-[#f5f0e8] mb-4">No Active Subscription</h1>
            <p className="text-sm text-[#f5f0e8]/70 mb-6">Get started with a plan to unlock KIAAN&apos;s full potential.</p>
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
      <div className="mb-8 rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#0d0d10]/90 via-[#050507]/80 to-[#0f0a08]/90 p-6 shadow-[0_18px_70px_rgba(46,160,255,0.14)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <KiaanLogo size="md" className="shrink-0" />
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#f5f0e8] mb-1">Subscription</h1>
          <p className="text-[#f5f0e8]/75 max-w-3xl">
            Manage your plan and track your usage with the Sakha by your side. Everything you need to stay on top of your membership is organized below.
          </p>
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
          description="Upgrade to Plus ($4.99/mo), Pro ($9.99/mo), Elite ($15/mo), or Premier ($25/mo) for more KIAAN questions and all features."
          ctaText="View Plans"
          ctaLink="/pricing"
          className="mb-8"
        />
      )}

      {/* Usage Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <UsageCard items={usageItems} />

        {/* Billing History (real data from payments API) */}
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#f5f0e8]">Billing History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/payment-status')}
              >
                View All
              </Button>
            </div>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center justify-between py-2">
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-[#d4a44c]/10" />
                      <div className="h-3 w-20 rounded bg-[#d4a44c]/10" />
                    </div>
                    <div className="h-5 w-16 rounded bg-[#d4a44c]/10" />
                  </div>
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <p className="text-sm text-[#f5f0e8]/60">
                {subscription.tierId === 'free'
                  ? 'No billing history for free plan.'
                  : 'No payment records found.'}
              </p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-[#d4a44c]/10 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-[#f5f0e8]">
                        {new Date(payment.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#f5f0e8]/60">
                          {payment.description || 'Payment'}
                        </p>
                        <span className="text-[10px] text-[#f5f0e8]/40">
                          {PROVIDER_LABELS[payment.payment_provider] ?? payment.payment_provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#f5f0e8] tabular-nums">
                        {formatPaymentAmount(payment.amount, payment.currency)}
                      </span>
                      <Badge
                        variant={STATUS_VARIANTS[payment.status] ?? 'default'}
                        size="sm"
                      >
                        {payment.status === 'succeeded' ? 'Paid' : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
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
          <h3 className="font-semibold text-[#f5f0e8] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleUpgrade} variant="outline" size="sm">
              Change Plan
            </Button>
            <Button onClick={() => router.push('/dashboard/payment-status')} variant="outline" size="sm">
              Payment History
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
