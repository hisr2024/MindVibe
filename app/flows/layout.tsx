import type { ReactNode } from 'react'
import Link from 'next/link'

const flowLinks = [
  { href: '/flows/access', label: 'Access' },
  { href: '/flows/check-in', label: 'State check-in' },
  { href: '/flows/kiaan', label: 'Talk to KIAAN' },
  { href: '/flows/ardha', label: 'Ardha reframing' },
  { href: '/flows/viyog', label: 'Outcome reset' },
  { href: '/flows/wisdom', label: 'Today’s wisdom' },
  { href: '/flows/journal', label: 'Private journal' },
]

export const metadata = {
  title: 'Guided Flows | MindVibe',
  description: 'Dedicated pages that keep each guided flow focused and functional.',
}

export default function FlowsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#050507] to-[#120907] text-[#f5f0e8]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#d4a44c]/30 via-[#ff9933]/16 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-80 w-80 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-[#d4a44c]/12 to-transparent blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,137,56,0.05),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.04),transparent_35%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-10">
        <header className="rounded-3xl border border-[#d4a44c]/15 bg-[#0d0d10]/90 p-6 md:p-8 shadow-[0_24px_96px_rgba(212,164,76,0.16)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Functional flows</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#d4a44c] via-[#ffb347] to-[#e8b54a]">
                Dedicated pages, unchanged behaviors
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#f5f0e8]/80">
                Each flow sits on its own page with clear actions, so the underlying chat, pause logic, and journal tools stay intact.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-[#d4a44c]/40 bg-white/5 px-4 py-2 text-sm font-semibold text-[#f5f0e8] shadow-lg shadow-[#d4a44c]/20 transition hover:border-[#d4a44c]/80"
            >
              Dashboard shortcuts
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {flowLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-[#d4a44c]/20 bg-black/40 p-4 text-sm font-semibold text-[#f5f0e8]/85 shadow-[0_10px_30px_rgba(212,164,76,0.14)] transition hover:border-[#d4a44c]/70 hover:text-[#f5f0e8]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </header>

        {children}
      </div>
    </main>
  )
}
