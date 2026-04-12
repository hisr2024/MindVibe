import type { ReactNode } from 'react'
import CosmicParticles from '@/components/kiaan-ecosystem/CosmicParticles'
import KrishnaSilhouette from '@/components/kiaan-ecosystem/KrishnaSilhouette'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata = {
  title: 'KIAAN - Your AI Spiritual Guide | Sakha',
  description: 'Talk to KIAAN, your calm and compassionate AI spiritual companion. Receive personalized guidance rooted in Bhagavad Gita wisdom for inner peace and self-discovery.',
}

/**
 * KIAAN Layout — Divine Cosmic Theme + Sidebar Shell
 *
 * Deep black void with golden nebula accents, floating cosmic particles,
 * and a barely-perceptible Krishna silhouette as ambient divine presence.
 *
 * On desktop (≥1024px) the parent MobileContentWrapper switches to
 * flex-row, so <Sidebar> and the cosmic content <section> sit side-by-side.
 * On mobile the Sidebar is hidden via CSS (`hidden lg:flex`).
 */
export default function KiaanLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <section className="kiaan-cosmic-bg flex-1 min-w-0 min-h-screen lg:min-h-0 text-[#e8dcc8] relative overflow-hidden lg:flex lg:flex-col">
        {/* Cosmic nebula gradients */}
        <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
          {/* Golden nebula - top left */}
          <div className="kiaan-nebula absolute -left-32 top-16 h-96 w-96 rounded-full bg-gradient-to-br from-[#d4a44c]/12 via-[#c8943a]/6 to-transparent blur-[100px]" />
          {/* Golden nebula - bottom right */}
          <div className="kiaan-nebula absolute -right-20 bottom-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tl from-[#d4a44c]/10 via-[#e8b54a]/5 to-transparent blur-[120px]" style={{ animationDelay: '-7s' }} />
          {/* Faint cosmic purple accent - center */}
          <div className="kiaan-nebula absolute top-1/3 left-1/2 -translate-x-1/2 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-[#8b5cf6]/[0.03] via-transparent to-transparent blur-[140px]" style={{ animationDelay: '-13s' }} />
          {/* Subtle radial light source behind content */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(212,164,76,0.04),transparent_60%),radial-gradient(ellipse_at_20%_80%,rgba(212,164,76,0.02),transparent_50%)]" />
        </div>

        {/* Cosmic golden particles — reduced count for smooth navigation */}
        <CosmicParticles count={20} />

        {/* Subtle Krishna silhouette - divine ambient presence */}
        <KrishnaSilhouette position="right" opacity={0.03} />

        {/* Content layer */}
        <div className="relative z-10 flex-1 min-h-0 lg:flex lg:flex-col lg:overflow-hidden">
          {children}
        </div>
      </section>
    </>
  )
}
