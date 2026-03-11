/**
 * Gita VR Experience — Page entry point.
 *
 * Dynamically imports the main experience component to keep
 * the initial bundle lean. Shows a sacred loading screen while
 * the heavy components load.
 */

'use client'

import dynamic from 'next/dynamic'

const GitaVRExperience = dynamic(() => import('./GitaVRExperience'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-black">
      <div className="mb-4 animate-pulse text-5xl text-amber-400/70">&#x0950;</div>
      <p className="text-xs tracking-widest text-amber-200/40">Loading sacred experience...</p>
    </div>
  ),
})

export default function GitaVRPage() {
  return <GitaVRExperience />
}
