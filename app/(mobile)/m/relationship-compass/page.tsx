'use client'

/**
 * Sacred Mobile Relationship Compass Page — 6-Chamber Sacred Journey
 *
 * Chamber I:   COMPASS ALTAR      — Entry & relationship naming
 * Chamber II:  GUNA MIRROR        — Pattern selection (Tamas/Rajas/Sattva)
 * Chamber III: DHARMA MAP         — Radar visualization
 * Chamber IV:  GITA COUNSEL       — AI wisdom (existing API unchanged)
 * Chamber V:   DHARMIC INTENTION  — Sankalpa setting
 * Chamber VI:  COMPASS SEAL       — Completion & summary
 */

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const CompassSacredJourney = dynamic(
  () => import('@/components/mobile/sacred-tools/compass/CompassSacredJourney'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SacredOMLoader size={48} message="Opening the Compass..." />
      </div>
    ),
  }
)

export default function MobileRelationshipCompassPage() {
  return (
    <MobileAppShell title="Relationship Compass" showBack showTabBar={false}>
      <CompassSacredJourney />
    </MobileAppShell>
  )
}
