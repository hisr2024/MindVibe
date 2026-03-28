'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const KarmicTreePageClient = dynamic(
  () => import('@/app/tools/karmic-tree/KarmicTreePageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileKarmicTreePage() {
  return (
    <MobileAppShell title="Karmic Tree">
      <div className="px-5 pb-8">
        <KarmicTreePageClient />
      </div>
    </MobileAppShell>
  )
}
