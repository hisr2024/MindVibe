'use client'

/**
 * Mobile Karma Reset Page
 *
 * Wraps the desktop KarmaResetClient in MobileAppShell
 * for the sacred mobile experience.
 */

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const KarmaResetClient = dynamic(
  () => import('@/app/tools/karma-reset/KarmaResetClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[50vh]">
        <SacredOMLoader size={48} message="Preparing karmic reset..." />
      </div>
    ),
  }
)

export default function MobileKarmaResetPage() {
  return (
    <MobileAppShell title="Karma Reset">
      <div className="px-5 pb-8">
        <KarmaResetClient />
      </div>
    </MobileAppShell>
  )
}
