'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const IntroductionPage = dynamic(
  () => import('@/app/introduction/page'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileIntroductionPage() {
  return (
    <MobileAppShell title="Welcome">
      <div className="px-5 pb-8">
        <IntroductionPage />
      </div>
    </MobileAppShell>
  )
}
