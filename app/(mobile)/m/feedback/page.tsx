'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const FeedbackPageClient = dynamic(
  () => import('@/app/feedback/FeedbackPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileFeedbackPage() {
  return (
    <MobileAppShell title="Feedback">
      <div className="px-5 pb-8">
        <FeedbackPageClient />
      </div>
    </MobileAppShell>
  )
}
