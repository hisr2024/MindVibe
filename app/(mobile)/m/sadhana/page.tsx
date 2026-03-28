'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const SadhanaExperience = dynamic(
  () => import('@/app/sadhana/SadhanaExperience').then(mod => mod.SadhanaExperience),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileSadhanaPage() {
  return (
    <MobileAppShell title="Nityam Sadhana">
      <div className="px-5 pb-8">
        <SadhanaExperience />
      </div>
    </MobileAppShell>
  )
}
