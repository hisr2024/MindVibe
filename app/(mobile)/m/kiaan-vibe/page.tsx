'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const KiaanVibePage = dynamic(
  () => import('@/app/kiaan-vibe/page'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileKiaanVibePage() {
  return (
    <MobileAppShell title="KIAAN Vibe">
      <div className="px-5 pb-8">
        <KiaanVibePage />
      </div>
    </MobileAppShell>
  )
}
