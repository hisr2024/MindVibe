'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const CommunityPage = dynamic(
  () => import('@/app/community/page'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileCommunityPage() {
  return (
    <MobileAppShell title="Community">
      <div className="px-5 pb-8">
        <CommunityPage />
      </div>
    </MobileAppShell>
  )
}
