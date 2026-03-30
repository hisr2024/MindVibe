'use client'

/**
 * Mobile Karma Reset Page — दुःख-संयोग-वियोग
 *
 * Full-screen immersive 6-phase sacred ritual for examining
 * actions through the light of the Bhagavad Gita.
 * No MobileAppShell wrapper — phases own the full screen.
 */

import dynamic from 'next/dynamic'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const KarmaResetScreen = dynamic(
  () => import('./KarmaResetScreen').then((mod) => ({ default: mod.KarmaResetScreen })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050714',
        }}
      >
        <SacredOMLoader size={48} message="Entering sacred space..." />
      </div>
    ),
  }
)

export default function MobileKarmaResetPage() {
  return <KarmaResetScreen />
}
