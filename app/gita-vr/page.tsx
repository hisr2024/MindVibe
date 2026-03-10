/**
 * Gita VR Page — Route Entry Point
 *
 * Dynamically imports the full VR experience to keep the main
 * app bundle lean. SSR disabled since Three.js requires browser APIs.
 */

'use client'

import dynamic from 'next/dynamic'

const GitaVRExperience = dynamic(
  () => import('./GitaVRExperience'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-48 w-48 animate-pulse rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(212, 164, 76, 0.15) 0%, transparent 70%)',
            }}
          />
          <span
            className="relative text-7xl"
            style={{
              color: '#d4a44c',
              textShadow: '0 0 30px rgba(212, 164, 76, 0.5)',
            }}
          >
            &#x0950;
          </span>
        </div>
        <p className="mt-8 text-sm tracking-widest text-[#d4a44c]/60">
          Preparing the Sacred Battlefield...
        </p>
      </div>
    ),
  }
)

export default function GitaVRPage() {
  return <GitaVRExperience />
}
