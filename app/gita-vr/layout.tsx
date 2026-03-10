/**
 * Gita VR Layout — Fullscreen Immersive Experience
 *
 * No navigation chrome. Pure immersive 3D canvas fills the viewport.
 * Dark background prevents white flash during load.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bhagavad Gita VR Experience | MindVibe',
  description: 'Immersive 3D experience of Krishna delivering Gita teachings to Arjuna on the Kurukshetra battlefield. Ask Krishna questions powered by KIAAN AI.',
}

export default function GitaVRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {children}
    </div>
  )
}
