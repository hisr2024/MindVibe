'use client'

/**
 * Sacred Mobile Viyoga Page — 5-Movement Sacred Journey
 *
 * Movement I:   AAROHA   — The Ascending Entry
 * Movement II:  VILAP    — The Sacred Expression (Separation Map)
 * Movement III: DARSHAN  — Sakha's Witnessing (AI wisdom)
 * Movement IV:  DHYAN    — The Sacred Meditation
 * Movement V:   VISARJAN — The Sacred Release Ceremony
 */

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const ViyogaSacredJourney = dynamic(
  () => import('@/components/mobile/sacred-tools/viyoga/ViyogaSacredJourney'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SacredOMLoader size={48} message="Preparing the sacred space..." />
      </div>
    ),
  }
)

export default function MobileViyogPage() {
  return (
    <MobileAppShell title="Viyoga" showBack showTabBar={false}>
      <ViyogaSacredJourney />
    </MobileAppShell>
  )
}
