'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const DeepInsightsPage = dynamic(
  () => import('@/app/deep-insights/page'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileDeepInsightsPage() {
  return (
    <MobileAppShell title="Deep Insights">
      <div className="px-5 pb-8">
        <DeepInsightsPage />
      </div>
    </MobileAppShell>
  )
}
