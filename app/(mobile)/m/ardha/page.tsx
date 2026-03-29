'use client'

/**
 * Sacred Mobile Ardha Page — Enhanced Kiaanverse Design
 *
 * Atma-Reframing through Dharma & Higher Awareness.
 * Same API (/api/ardha/reframe), same response generation —
 * but with the full Kiaanverse sacred design system.
 */

import dynamic from 'next/dynamic'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const ArdhaSacredPage = dynamic(
  () => import('@/components/mobile/sacred-tools/ardha/ArdhaSacredPage'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SacredOMLoader size={48} message="Preparing ARDHA..." />
      </div>
    ),
  }
)

export default function MobileArdhaPage() {
  return (
    <MobileAppShell title="Ardha" showBack showTabBar={false}>
      <ArdhaSacredPage />
    </MobileAppShell>
  )
}
