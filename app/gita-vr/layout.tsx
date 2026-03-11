/**
 * Gita VR Layout — Fullscreen immersive layout.
 *
 * Strips all navigation chrome. Pure immersive canvas.
 * Sets metadata for the Gita VR experience page.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bhagavad Gita — Immersive Experience | MindVibe',
  description:
    'Experience the Bhagavad Gita on the sacred battlefield of Kurukshetra. Ask Lord Krishna questions and receive wisdom from the Song of God.',
}

export default function GitaVRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-black">
      {children}
    </div>
  )
}
