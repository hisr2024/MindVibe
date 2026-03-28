'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const KarmaFootprintClient = dynamic(
  () => import('@/app/tools/karma-footprint/KarmaFootprintClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileKarmaFootprintPage() {
  return (
    <MobileAppShell title="Karma Footprint">
      <div className="px-5 pb-8">
        <KarmaFootprintClient />
      </div>
    </MobileAppShell>
  )
}
