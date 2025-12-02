'use client'

import { Card, CardContent, Badge, Button } from '@/components/ui'
import { type Subscription } from '@/hooks/useSubscription'

interface CurrentPlanCardProps {
  subscription: Subscription
  onManage?: () => void
  onUpgrade?: () => void
  className?: string
}

export function CurrentPlanCard({ subscription, onManage, onUpgrade, className = '' }: CurrentPlanCardProps) {
  const periodEnd = new Date(subscription.currentPeriodEnd)
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const statusBadge = {
    active: { variant: 'success' as const, label: 'Active' },
    canceled: { variant: 'warning' as const, label: 'Canceled' },
    past_due: { variant: 'danger' as const, label: 'Past Due' },
    trialing: { variant: 'info' as const, label: 'Trial' },
  }[subscription.status]

  return (
    <Card variant="elevated" className={className}>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-orange-100/60 mb-1">Current Plan</p>
            <h3 className="text-2xl font-bold text-orange-50">{subscription.tierName}</h3>
          </div>
          <Badge variant={statusBadge.variant} dot>
            {statusBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-black/30 border border-orange-500/15 p-3">
            <p className="text-xs text-orange-100/60 mb-1">Billing Cycle</p>
            <p className="text-sm font-semibold text-orange-50">
              {subscription.isYearly ? 'Yearly' : 'Monthly'}
            </p>
          </div>
          <div className="rounded-xl bg-black/30 border border-orange-500/15 p-3">
            <p className="text-xs text-orange-100/60 mb-1">
              {subscription.cancelAtPeriodEnd ? 'Ends in' : 'Renews in'}
            </p>
            <p className="text-sm font-semibold text-orange-50">
              {daysRemaining} days
            </p>
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
            <p className="text-sm text-amber-50">
              Your subscription is set to cancel on {periodEnd.toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {subscription.tierId === 'free' ? (
            <Button onClick={onUpgrade} variant="primary" size="md" className="flex-1">
              Upgrade Plan
            </Button>
          ) : (
            <>
              <Button onClick={onManage} variant="secondary" size="md" className="flex-1">
                Manage Subscription
              </Button>
              {subscription.tierId !== 'enterprise' && (
                <Button onClick={onUpgrade} variant="outline" size="md">
                  Upgrade
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CurrentPlanCard
