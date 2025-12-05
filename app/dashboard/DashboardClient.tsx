'use client'

import Link from 'next/link'

const dashboardCards = [
  { href: '/kiaan', icon: '💬', title: 'KIAAN Chat', description: 'AI companion for guidance' },
  { href: '/sacred-reflections', icon: '📝', title: 'Journal', description: 'Encrypted personal reflections' },
  { href: '/wisdom-rooms', icon: '🌍', title: 'Wisdom Rooms', description: 'Community chat spaces' },
  { href: '/tools/state-check-in', icon: '🔵', title: 'Mood Check-In', description: 'Log your current state' },
  { href: '/tools/output-reducer', icon: '✂️', title: 'Output Reducer', description: 'Simplify lengthy text' },
  { href: '/tools/clarity-pause', icon: '🧘', title: 'Clarity Pause', description: 'Guided breathing moment' },
  { href: '/tools/trigger-factor', icon: '🎯', title: 'Trigger Factor', description: 'Identify and log triggers' },
  { href: '/ardha', icon: '🔄', title: 'Ardha', description: 'Gita-aligned reframing' },
  { href: '/viyog', icon: '🎯', title: 'Vyyoga', description: 'Outcome anxiety reducer' },
  { href: '/relationship-compass', icon: '🧭', title: 'Relationship Compass', description: 'Calm conflict guidance' },
  { href: '/karmic-tree', icon: '🌱', title: 'Karmic Tree', description: 'Visual progress tracking' },
  { href: '/profile', icon: '⚙️', title: 'Profile', description: 'User preferences' },
]

export default function DashboardClient() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-orange-100/70 mt-1">Access all MindVibe tools from one place</p>
        </header>

        {/* 12-Card Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {dashboardCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-orange-500/20 bg-[#0d0d10]/85 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.08)] hover:border-orange-400/40 hover:shadow-orange-500/15 transition"
            >
              <span className="text-3xl block mb-3">{card.icon}</span>
              <h3 className="text-base font-semibold text-orange-50 mb-1">{card.title}</h3>
              <p className="text-xs text-orange-100/60">{card.description}</p>
            </Link>
          ))}
        </section>

        {/* Privacy Badge */}
        <div className="bg-orange-500/5 backdrop-blur border border-orange-500/20 rounded-2xl p-3 text-center">
          <p className="text-sm text-orange-100/80">🔒 All data is encrypted and stored locally on your device</p>
        </div>
      </div>
    </main>
  )
}
