'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const ViyogClient = dynamic(
  () => import('@/app/tools/viyog/ViyogClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileViyogPage() {
  return (
    <MobileAppShell title="Viyoga">
      <div className="px-5 pb-8">
        <ViyogClient />
      </div>
    </MobileAppShell>
  )
}
