'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const EmotionalResetClient = dynamic(
  () => import('@/app/tools/emotional-reset/EmotionalResetClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileEmotionalResetPage() {
  return (
    <MobileAppShell title="Emotional Reset">
      <div className="px-5 pb-8">
        <EmotionalResetClient />
      </div>
    </MobileAppShell>
  )
}
