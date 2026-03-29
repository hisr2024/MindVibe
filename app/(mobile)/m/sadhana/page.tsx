'use client'

/**
 * Mobile Sadhana Page — Native mobile implementation replacing the
 * desktop wrapper. Uses NityaSadhanaScreen with the divine design system.
 */

import dynamic from 'next/dynamic'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const NityaSadhanaScreen = dynamic(
  () => import('./NityaSadhanaScreen').then(mod => mod.NityaSadhanaScreen),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[100dvh] bg-[#050714]">
        <SacredOMLoader size={48} />
      </div>
    ),
  }
)

export default function MobileSadhanaPage() {
  return <NityaSadhanaScreen />
}
