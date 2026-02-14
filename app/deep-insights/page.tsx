'use client'

import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'

const insightTools = [
  {
    href: '/ardha',
    title: 'Ardha',
    purposeDescKey: 'ardha',
    description: 'Reframe spiraling thoughts with calm, Ancient Wisdom-aligned perspective.',
    accent: 'from-amber-400/20 via-orange-400/15 to-rose-300/15',
    logo: <ArdhaLogo />,
  },
  {
    href: '/viyog',
    title: 'Viyoga',
    purposeDescKey: 'viyog',
    description: 'Release outcome anxiety and return to one grounded action.',
    accent: 'from-cyan-400/25 via-blue-400/15 to-indigo-400/10',
    logo: <ViyogaLogo />,
  },
  {
    href: '/relationship-compass',
    title: 'Relationship Compass',
    purposeDescKey: 'relationship-compass',
    description: 'Navigate tense conversations with clear, ego-light next steps.',
    accent: 'from-rose-400/20 via-orange-400/15 to-yellow-300/10',
    logo: <RelationshipCompassLogo />,
  },
]

function ArdhaLogo() {
  return (
    <div className="relative h-14 w-14" aria-hidden>
      <div className="absolute inset-0 animate-[spin_9s_linear_infinite] rounded-3xl bg-gradient-to-br from-amber-300 via-orange-500/50 to-pink-400 opacity-60 blur" />
      <div className="absolute inset-[3px] rounded-[26px] bg-white/10 backdrop-blur" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[28px] bg-gradient-to-br from-amber-500/90 via-orange-500/80 to-pink-500/80 shadow-[0_10px_45px_rgba(255,159,67,0.38)] ring-1 ring-white/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-base font-black uppercase tracking-tight text-slate-950">
          Δ
        </div>
      </div>
    </div>
  )
}

function ViyogaLogo() {
  return (
    <div className="relative h-14 w-14" aria-hidden>
      <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-3xl bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 opacity-60 blur" />
      <div className="absolute inset-1 rounded-[22px] border border-cyan-200/50 bg-white/5" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[26px] bg-gradient-to-br from-sky-600 via-cyan-500 to-indigo-600 shadow-[0_10px_45px_rgba(56,189,248,0.45)] ring-1 ring-white/40">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/60 text-sm font-black uppercase tracking-wide text-white">
          VY
        </div>
      </div>
    </div>
  )
}

function RelationshipCompassLogo() {
  return (
    <div className="relative h-14 w-14" aria-hidden>
      <div className="absolute inset-0 animate-[spin_7s_linear_infinite] rounded-3xl bg-[conic-gradient(at_50%_50%,#fb7185_0deg,#f97316_120deg,#fde047_240deg,#fb7185_360deg)] opacity-60 blur" />
      <div className="absolute inset-[3px] rounded-[26px] bg-white/10 backdrop-blur" />
      <div className="relative flex h-full w-full items-center justify-center rounded-[28px] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 shadow-[0_10px_45px_rgba(251,113,133,0.32)] ring-1 ring-white/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/60 text-lg font-black text-white">
          ↺
        </div>
      </div>
    </div>
  )
}

export default function DeepInsightsPage() {
  const { t } = useLanguage()

  return (
    <main className="mv-page relative min-h-screen p-4 md:p-8 pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/20 via-amber-400/10 to-transparent blur-3xl" />
        <div className="absolute right-6 bottom-10 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400/20 via-teal-300/10 to-transparent blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-3 rounded-3xl border border-white/5 bg-[var(--brand-surface)]/80 p-6 md:p-10 shadow-[0_25px_120px_rgba(255,147,71,0.18)] backdrop-blur">
          <p className="text-sm text-white/70">Guided, high-focus tools</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Deep Insights</h1>
          <p className="max-w-2xl text-base text-white/70">
            Explore focused companions designed for reframing, detachment, and relationship clarity. Each module opens its own
            dedicated workspace—clean, fast, and ready to use.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Deep Insights tools">
          {insightTools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_18px_70px_rgba(255,147,71,0.14)] transition hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tool.accent} opacity-0 blur-3xl transition duration-300 group-hover:opacity-100`} />
              <div className="relative space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-white">{tool.title}</h2>
                    <p className="text-xs text-white/50 truncate">
                      {t(`dashboard.tool_desc.${tool.purposeDescKey}`, '')}
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-300 animate-pulse" aria-hidden />
                      Open
                    </span>
                  </div>
                  {tool.logo}
                </div>
                <p className="text-sm text-white/70">{tool.description}</p>
              </div>
              <div className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-orange-200">
                <span>Launch</span>
                <span aria-hidden>→</span>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
