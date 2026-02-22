import type { ReactNode } from 'react'

export const metadata = {
  title: 'KIAAN - Your AI Spiritual Guide | MindVibe',
  description: 'Talk to KIAAN, your calm and compassionate AI spiritual companion. Receive personalized guidance rooted in Bhagavad Gita wisdom for inner peace and self-discovery.',
}

/**
 * Simplified KIAAN Layout
 * Provides a clean background for KIAAN Chat without the Experience Hub navigation
 */
export default function KiaanLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-orange-50">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-gradient-to-br from-orange-600/30 via-[#ff9933]/16 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-80 w-80 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-orange-500/12 to-transparent blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <div className="relative">
        {children}
      </div>
    </main>
  )
}
