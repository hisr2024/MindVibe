'use client'

import Link from 'next/link'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { Button, Card, CardContent } from '@/components/ui'

interface SubscriptionGateProps {
  /** Feature key from useFeatureAccess (e.g. 'voice_companion', 'advanced_analytics') */
  feature: string
  /** Content to render when the user has access */
  children: React.ReactNode
  /** Optional override for the fallback UI. When omitted, shows default upgrade prompt. */
  fallback?: React.ReactNode
}

/**
 * Wraps content behind a subscription gate.
 *
 * When the user's tier is below the required tier, shows an upgrade prompt
 * instead of the gated content. Use this to gate entire pages or sections.
 */
export function SubscriptionGate({ feature, children, fallback }: SubscriptionGateProps) {
  const { hasAccess, requiredTier, featureLabel, loading } = useFeatureAccess()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-400" />
      </div>
    )
  }

  if (hasAccess(feature)) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const tierNames: Record<string, string> = { free: 'Free', basic: 'Plus', premium: 'Pro' }
  const tierLabel = tierNames[requiredTier(feature)] ?? requiredTier(feature)
  const label = featureLabel(feature)

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card variant="elevated">
        <CardContent>
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-rose-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-orange-50 mb-2">
              Unlock {label}
            </h2>

            <p className="text-sm text-orange-100/70 mb-6">
              {label} is available on the {tierLabel} plan and above.
              Upgrade to continue your journey toward inner peace.
            </p>

            <div className="rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-400/30 p-4 mb-6">
              <p className="text-sm font-medium text-orange-50 mb-3">{tierLabel} plan includes:</p>
              <ul className="text-sm text-orange-100/80 space-y-2 text-left">
                {tierLabel === 'Plus' ? (
                  <>
                    <FeatureItem text="150 KIAAN questions/month" />
                    <FeatureItem text="Encrypted journal" />
                    <FeatureItem text="Voice synthesis" />
                    <FeatureItem text="3 Wisdom Journeys" />
                    <FeatureItem text="Starting at $4.99/month" />
                  </>
                ) : (
                  <>
                    <FeatureItem text="300 KIAAN questions/month" />
                    <FeatureItem text="Voice Companion & Soul Reading" />
                    <FeatureItem text="Advanced analytics & insights" />
                    <FeatureItem text="10 Wisdom Journeys" />
                    <FeatureItem text="Starting at $9.99/month" />
                  </>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/pricing" className="w-full">
                <Button variant="primary" size="lg" className="w-full">
                  View Plans
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full">
                <Button variant="ghost" size="md" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {text}
    </li>
  )
}

export default SubscriptionGate
