import type { ReactNode } from 'react'
import Link from 'next/link'

const navLinks = [
  {
    href: '/kiaan/features',
    title: 'KIAAN features',
    detail: 'Dedicated breakdown of guidance suites and safeguards.'
  },
  {
    href: '/kiaan/experiences',
    title: 'Experience flows',
    detail: 'Multi-page journeys that keep the chat ecosystem intact.'
  },
  {
    href: '/kiaan/profile',
    title: 'Personal profile',
    detail: 'Store your own focus areas locally—no backend changes.'
  },
  {
    href: '/',
    title: 'Back to chat',
    detail: 'Return to the original KIAAN chat without disruption.'
  }
]

export const metadata = {
  title: 'KIAAN Experience Hub',
  description: 'Explore KIAAN across multiple pages without altering the core chat.',
}

function NavCard({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-orange-500/20 bg-black/40 p-4 shadow-[0_10px_30px_rgba(255,115,39,0.14)] transition hover:border-orange-400/60 hover:shadow-orange-500/20"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">{href === '/' ? 'Home' : 'Navigation'}</p>
      <h3 className="mt-1 text-lg font-semibold text-orange-50">{title}</h3>
      <p className="text-sm text-orange-100/80 leading-relaxed">{detail}</p>
    </Link>
  )
}

export default function KiaanLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-orange-50">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-gradient-to-br from-orange-600/30 via-[#ff9933]/16 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-80 w-80 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-orange-500/12 to-transparent blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="overflow-hidden rounded-3xl border border-orange-500/10 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 md:p-8 shadow-[0_30px_120px_rgba(255,115,39,0.16)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Multi-page companion</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-100">
                KIAAN Experience Hub
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-orange-100/85">
                Explore KIAAN across focused pages—feature overviews, guided flows, and a personal profile area—without touching the core chat ecosystem.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-orange-400/40 bg-white/5 px-4 py-2 text-sm font-semibold text-orange-50 shadow-lg shadow-orange-500/20 transition hover:border-orange-300/80"
            >
              Return to KIAAN chat
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {navLinks.map(link => (
              <NavCard key={link.href} {...link} />
            ))}
          </div>
        </header>

        {children}
      </div>
    </main>
  )
}
