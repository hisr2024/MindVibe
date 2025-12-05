'use client'

import Link from 'next/link'
import { Badge, Button, ProgressBar } from '@/components/ui'
import type { Subscription } from '@/hooks/useSubscription'

interface PlanOverviewProps {
  subscription: Subscription
  usage?: {
    kiaanChats: { used: number; limit: number }
    features: string[]
  }
  className?: string
}

const tierFeatures: Record<string, string[]> = {
  free: [
    '20 KIAAN questions/month',
    'Mood tracking',
    'Daily wisdom',
    'Basic breathing exercises',
  ],
  basic: [
    '75 KIAAN questions/month',
    'All Free features',
    'Guided breathing sessions',
    'Mood journaling prompts',
    'Priority email support',
  ],
  pro: [
    '150 KIAAN questions/month',
    'All Basic features',
    'Journal with encryption',
    'Ardha Reframing Assistant',
    'Viyog Detachment Coach',
  ],
  premium: [
    '300 KIAAN questions/month',
    'All Pro features',
    'Relationship Compass',
    'Karma Reset Guide',
    'Priority support',
    'Advanced mood analytics',
  ],
  executive: [
    'Unlimited KIAAN questions',
    'All Premium features',
    'API access',
    'Dedicated support',
    'SLA guarantee',
  ],
}

const tierLimits: Record<string, number> = {
  free: 20,
  basic: 75,
  pro: 150,
  premium: 300,
  executive: -1, // Unlimited
}

export function PlanOverview({ subscription, usage, className = '' }: PlanOverviewProps) {
  const features = tierFeatures[subscription.tierId] || tierFeatures.free
  const limit = tierLimits[subscription.tierId] || 20
  const currentUsage = usage?.kiaanChats || { used: 0, limit }

  const daysUntilRenewal = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const getStatusBadge = () => {
    if (subscription.cancelAtPeriodEnd) {
      return <Badge variant="warning">Canceling</Badge>
    }
    switch (subscription.status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'past_due':
        return <Badge variant="danger">Past Due</Badge>
      case 'trialing':
        return <Badge variant="info">Trial</Badge>
      default:
        return <Badge variant="default">{subscription.status}</Badge>
    }
  }

  return (
    <div className={`rounded-2xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-orange-50">{subscription.tierName}</h2>
            {getStatusBadge()}
            {subscription.isYearly && (
              <Badge variant="premium" size="sm">Yearly</Badge>
            )}
          </div>
          <p className="text-sm text-orange-100/60">
            {subscription.cancelAtPeriodEnd
              ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : `Renews in ${daysUntilRenewal} days`}
          </p>
        </div>
        <Link href="/pricing">
          <Button variant="secondary" size="sm">
            {subscription.tierId === 'free' ? 'Upgrade' : 'Change Plan'}
          </Button>
        </Link>
      </div>

      {/* Usage Stats */}
      {limit > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-black/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-100/70">KIAAN Questions Used</span>
            <span className="text-sm font-semibold text-orange-50">
              {currentUsage.used} / {currentUsage.limit}
            </span>
          </div>
          <ProgressBar
            value={currentUsage.used}
            max={currentUsage.limit}
            variant={currentUsage.used / currentUsage.limit > 0.8 ? 'warning' : 'default'}
          />
          {currentUsage.used / currentUsage.limit > 0.8 && (
            <p className="text-xs text-amber-400 mt-2">
              ⚠️ You're approaching your monthly limit
            </p>
          )}
        </div>
      )}

      {limit === -1 && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-sm font-medium text-emerald-50">Unlimited KIAAN Questions</span>
          </div>
        </div>
      )}

      {/* Features List */}
      <div>
        <h3 className="text-sm font-semibold text-orange-100/70 mb-3">Plan Features</h3>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-orange-100/80">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PlanOverview
