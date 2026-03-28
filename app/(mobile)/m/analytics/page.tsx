'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const AnalyticsPageClient = dynamic(
  () => import('@/app/analytics/AnalyticsPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileAnalyticsPage() {
  return (
    <MobileAppShell title="Analytics">
      <div className="px-5 pb-8">
        <AnalyticsPageClient />
      </div>
    </MobileAppShell>
  )
}
