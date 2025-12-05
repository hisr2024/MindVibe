'use client'

import Link from 'next/link'
import { type ReactElement } from 'react'
import { KiaanLogo } from '@/src/components/KiaanLogo'

type QuickAccessCardProps = {
  href: string
  icon: string
  title: string
  description: string
  gradient: string
}

function QuickAccessCard({ href, icon, title, description, gradient }: QuickAccessCardProps) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br ${gradient} p-5 shadow-[0_15px_50px_rgba(255,115,39,0.12)] transition-all hover:scale-[1.02] hover:shadow-orange-500/20 hover:border-orange-400/40`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5 blur-2xl transition-transform group-hover:scale-150" />
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="text-lg font-semibold text-orange-50 mb-1">{title}</h3>
      <p className="text-sm text-orange-100/70">{description}</p>
    </Link>
  )
}

function TokenCard({ label, note, tone, icon }: { label: string; note: string; tone: 'teal' | 'blue' | 'lilac'; icon: ReactElement }) {
  const toneColors = {
    teal: 'from-teal-400/20 to-cyan-400/10 border-teal-400/30',
    blue: 'from-blue-400/20 to-indigo-400/10 border-blue-400/30',
    lilac: 'from-purple-400/20 to-pink-400/10 border-purple-400/30'
  }

  return (
    <div className={`relative min-w-[140px] rounded-xl bg-gradient-to-br ${toneColors[tone]} border p-3 backdrop-blur`}>
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-lg">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white/90">{label}</p>
          <p className="text-xs text-white/60">{note}</p>
        </div>
      </div>
    </div>
  )
}

function SunriseIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M16 36c0-8 6.5-14 16-14s16 6 16 14" strokeLinejoin="round" />
      <path d="M12 44h40" />
      <path d="M32 12v8" />
      <circle cx="32" cy="34" r="6" fill="currentColor" className="text-orange-300" />
    </svg>
  )
}

function MindWaveIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M18 28c0-10 6-18 14-18s14 8 14 18c0 8-4 14-10 17v9l-8-5v-4C22 42 18 36 18 28Z" strokeLinejoin="round" />
      <path d="M22 28c2 2 4 3 6 3s4-1 6-3" />
    </svg>
  )
}

function HeartBreezeIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M22 22c-4 0-8 3-8 9 0 9 12 16 18 20 6-4 18-11 18-20 0-6-4-9-8-9-4 0-7 3-10 6-3-3-6-6-10-6Z" strokeLinejoin="round" />
    </svg>
  )
}

export default function Home() {
  const quickAccessTools = [
    {
      href: '/kiaan',
      icon: '💬',
      title: 'Talk to KIAAN',
      description: 'AI companion for guidance',
      gradient: 'from-[#0d0d10]/90 to-[#0f1214]/90'
    },
    {
      href: '/sacred-reflections',
      icon: '📝',
      title: 'Private Journal',
      description: 'Encrypted personal reflections',
      gradient: 'from-[#0d0d10]/90 to-[#121010]/90'
    },
    {
      href: '/wisdom-rooms',
      icon: '🌍',
      title: 'Wisdom Rooms',
      description: 'Community chat spaces',
      gradient: 'from-[#0d0d10]/90 to-[#0d1012]/90'
    },
    {
      href: '/tools/state-check-in',
      icon: '🎯',
      title: 'State Check-In',
      description: 'Log your current mood',
      gradient: 'from-[#0d0d10]/90 to-[#10120d]/90'
    },
    {
      href: '/tools/output-reducer',
      icon: '✂️',
      title: 'Output Reducer',
      description: 'Simplify lengthy text',
      gradient: 'from-[#0d0d10]/90 to-[#120d10]/90'
    },
    {
      href: '/tools/clarity-pause',
      icon: '🧘',
      title: 'Clarity Pause',
      description: 'Guided breathing moment',
      gradient: 'from-[#0d0d10]/90 to-[#0d0d12]/90'
    }
  ]

  return (
    <main className="min-h-screen p-4 md:p-8 pb-28">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-orange-600/20 via-[#ff9933]/10 to-transparent blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/15 via-orange-500/8 to-transparent blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Hero Header */}
        <header className="relative overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/95 via-[#0b0b0f]/90 to-[#120a07]/95 p-6 md:p-8 shadow-[0_25px_100px_rgba(255,115,39,0.15)] backdrop-blur">
          <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-orange-500/30 via-[#ffb347]/20 to-transparent blur-2xl" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <KiaanLogo size="lg" className="drop-shadow-[0_10px_40px_rgba(46,160,255,0.2)]" />
              <p className="text-sm text-orange-100/70 max-w-md">
                Your calm, private mental wellness companion
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <TokenCard label="Inner Peace" note="Breath & focus" tone="teal" icon={<SunriseIcon />} />
              <TokenCard label="Mind Control" note="Steady steps" tone="blue" icon={<MindWaveIcon />} />
              <TokenCard label="Self Kindness" note="Welcome here" tone="lilac" icon={<HeartBreezeIcon />} />
            </div>
          </div>
        </header>

        {/* Privacy Badge */}
        <div className="bg-orange-500/5 backdrop-blur border border-orange-500/20 rounded-2xl p-3 text-center">
          <p className="text-sm text-orange-100/80">🔒 Private & encrypted • Your data stays on your device</p>
        </div>

        {/* Quick Access Cards */}
        <section>
          <h2 className="text-xl font-semibold text-orange-50 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAccessTools.map((tool) => (
              <QuickAccessCard key={tool.href} {...tool} />
            ))}
          </div>
        </section>

        {/* Feature Links */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/ardha"
            className="rounded-xl border border-orange-500/20 bg-[#0d0d10]/80 p-4 text-center hover:border-orange-400/40 transition"
          >
            <span className="text-2xl block mb-1">🔄</span>
            <span className="text-sm font-medium text-orange-50">Ardha</span>
          </Link>
          <Link
            href="/viyog"
            className="rounded-xl border border-orange-500/20 bg-[#0d0d10]/80 p-4 text-center hover:border-orange-400/40 transition"
          >
            <span className="text-2xl block mb-1">🎯</span>
            <span className="text-sm font-medium text-orange-50">Vyyoga</span>
          </Link>
          <Link
            href="/relationship-compass"
            className="rounded-xl border border-orange-500/20 bg-[#0d0d10]/80 p-4 text-center hover:border-orange-400/40 transition"
          >
            <span className="text-2xl block mb-1">🧭</span>
            <span className="text-sm font-medium text-orange-50">Compass</span>
          </Link>
          <Link
            href="/karmic-tree"
            className="rounded-xl border border-orange-500/20 bg-[#0d0d10]/80 p-4 text-center hover:border-orange-400/40 transition"
          >
            <span className="text-2xl block mb-1">🌱</span>
            <span className="text-sm font-medium text-orange-50">Karmic Tree</span>
          </Link>
        </section>

        {/* Disclaimer */}
        <section className="bg-[#0b0b0f]/80 border border-orange-500/10 rounded-2xl p-4">
          <p className="text-xs text-orange-100/60 leading-relaxed">
            <strong className="text-orange-100/80">Disclaimer:</strong> KIAAN offers supportive reflections inspired by wisdom traditions. Not medical advice. If facing serious concerns, please contact emergency services or a licensed professional.
          </p>
        </section>
      </div>
    </main>
  )
}
