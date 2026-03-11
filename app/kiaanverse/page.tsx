/**
 * Kiaanverse — Page entry point.
 *
 * Dynamically imports the main VR experience to keep the initial
 * bundle lean. Shows a sacred loading screen while heavy WebXR
 * components load.
 */

'use client'

import dynamic from 'next/dynamic'

const KiaanverseExperience = dynamic(() => import('./KiaanverseExperience'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-black">
      <div className="mb-6 animate-pulse text-6xl text-amber-400/70">&#x0950;</div>
      <p className="mb-2 text-lg tracking-widest text-amber-200/60">
        Kiaanverse
      </p>
      <p className="text-xs tracking-widest text-amber-200/30">
        Preparing your sacred experience...
      </p>
    </div>
  ),
})

export default function KiaanversePage() {
  return <KiaanverseExperience />
}
