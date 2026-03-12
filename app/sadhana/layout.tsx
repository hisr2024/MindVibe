/**
 * Sadhana Layout — Fullscreen immersive layout with no navigation chrome.
 * This creates a distraction-free sacred space for the daily practice.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nityam Sadhana — Daily Sacred Practice | MindVibe',
  description: 'Begin your personalized daily spiritual practice with KIAAN-guided breathwork, Gita verse meditation, and sacred reflection.',
}

export default function SadhanaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a14] text-white overflow-hidden">
      {children}
    </div>
  )
}
