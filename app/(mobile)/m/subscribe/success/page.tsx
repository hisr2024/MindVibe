'use client'

/**
 * Mobile Subscription Success Page
 *
 * Screen 3 of the subscription flow.
 * Shows OM bloom animation, Gita verse, feature unlock list.
 * Validates subscription via API and updates local state.
 */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SuccessScreen } from '@/components/mobile/payment/SuccessScreen'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { updateSubscription, type Subscription } from '@/hooks/useSubscription'
import { getPlanById, type PlanId } from '@/lib/payments/subscription'

const tierNames: Record<string, string> = {
  seeker: 'Seeker',
  pro: 'Bhakta',
  circle: 'Sadhak',
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const rawPlan = searchParams.get('plan') || 'pro'
  const planId: PlanId = (['seeker', 'pro', 'circle'] as PlanId[]).includes(rawPlan as PlanId)
    ? rawPlan as PlanId
    : 'pro'

  const plan = getPlanById(planId)
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    async function validateSubscription() {
      try {
        const response = await fetch('/api/subscriptions/current', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const subscription: Subscription = {
            id: String(data.id ?? `sub_${planId}`),
            tierId: data.effective_tier ?? data.plan?.tier ?? planId,
            tierName: data.plan?.name ?? tierNames[planId] ?? 'Bhakta',
            status: (data.status as Subscription['status']) ?? 'active',
            currentPeriodEnd: data.current_period_end
              ? new Date(data.current_period_end).toISOString()
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
            isYearly: true,
            isDeveloper: Boolean(data.is_developer),
          }
          updateSubscription(subscription)
        }
      } catch {
        // Subscription validation is non-critical — proceed with URL tier
      } finally {
        setValidated(true)
      }
    }

    validateSubscription()
  }, [planId])

  if (!validated) {
    return (
      <div className="min-h-screen bg-[#050714] flex items-center justify-center">
        <SacredOMLoader size={48} message="Confirming your journey..." />
      </div>
    )
  }

  return (
    <SuccessScreen
      trialDays={plan?.trialDays || 7}
    />
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050714] flex items-center justify-center">
          <SacredOMLoader size={48} message="Loading..." />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
