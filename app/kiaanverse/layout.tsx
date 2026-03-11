/**
 * Kiaanverse Layout — Fullscreen immersive VR layout.
 *
 * Strips all navigation chrome for pure immersive canvas.
 * Supports WebXR fullscreen experience.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kiaanverse — Bhagavad Gita VR | MindVibe',
  description:
    'Experience the Bhagavad Gita in immersive VR. Converse with Lord Krishna as your divine friend (Sakha) on the sacred battlefield of Kurukshetra.',
}

export default function KiaanverseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-black">
      {children}
    </div>
  )
}
