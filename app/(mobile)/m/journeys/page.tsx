/**
 * Mobile Journeys Page — Thin wrapper that loads the 4-tab JourneysScreen.
 *
 * The previous single-page implementation has been replaced with a tabbed
 * Shadripu journey experience (Today / My Journeys / Battleground / Wisdom).
 * Original source preserved in page.old.tsx for reference.
 */

'use client'

import dynamic from 'next/dynamic'

const JourneysScreen = dynamic(() => import('./JourneysScreen'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#050714] flex items-center justify-center">
      <div className="relative">
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#D4A017]/30 border-t-[#D4A017]" />
        <div className="absolute inset-0 h-14 w-14 animate-ping rounded-full border border-[#D4A017]/20" />
      </div>
    </div>
  ),
})

export default function MobileJourneysPage() {
  return <JourneysScreen />
}
