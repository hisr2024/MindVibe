'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const SubscriptionDashboardPage = dynamic(
  () => import('@/app/dashboard/subscription/page'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileSubscriptionPage() {
  return (
    <MobileAppShell title="Subscription">
      <div className="px-5 pb-8">
        <SubscriptionDashboardPage />
      </div>
    </MobileAppShell>
  )
}
