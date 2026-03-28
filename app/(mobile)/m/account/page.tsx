'use client'

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const AccountPageClient = dynamic(
  () => import('@/app/account/AccountPageClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileAccountPage() {
  return (
    <MobileAppShell title="Account">
      <div className="px-5 pb-8">
        <AccountPageClient />
      </div>
    </MobileAppShell>
  )
}
