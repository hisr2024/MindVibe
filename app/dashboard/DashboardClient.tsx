'use client'

import Link from 'next/link'
import Chat from '../components/Chat'
import JournalEncrypted from '../components/JournalEncrypted'
import { KiaanLogo } from '@/src/components/KiaanLogo'
import { HelpIcon, FadeIn } from '@/components/ui'
import { ToolGrid, QuickLinks } from '@/components/dashboard'
import {
  CORE_TOOLS,
  GUIDANCE_TOOLS,
  KARMA_TOOLS,
  QUICK_ACCESS_TOOLS,
} from '@/lib/constants/tools'

export default function DashboardClient() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 lg:px-6">
      {/* Hero Section */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
          <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/20 bg-black/40 px-4 py-3 shadow-[0_14px_60px_rgba(46,160,255,0.18)]">
              <KiaanLogo size="md" className="shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">MindVibe Companion</p>
                <p className="text-sm text-orange-100/85">KIAAN — Crisp, calm guidance.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-orange-100/80">
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-50">
                Dashboard
              </span>
              <HelpIcon content="All data stays on your device with AES-GCM encryption" />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-orange-50 md:text-5xl">MindVibe Dashboard</h1>
              <p className="max-w-3xl text-lg text-orange-100/85">
                Your MindVibe control center with 16 integrated tools. Access all your tools, flows, and encrypted notes in one
                place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href="#chat"
                className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 text-slate-900 shadow-orange-500/25"
              >
                Launch guided chat
              </Link>
              <Link href="#journal" className="rounded-2xl border border-orange-500/30 px-4 py-2 text-orange-50">
                Capture a private note
              </Link>
              <Link href="#tools" className="rounded-2xl border border-orange-500/20 px-4 py-2 text-orange-50">
                Explore all tools
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              {["16 Tools", "Encrypted journaling", "All tools on dashboard"].map((item) => (
                <span key={item} className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Core Tools Section */}
      <FadeIn delay={0.15}>
        <div id="tools">
          <ToolGrid
            title="Core Tools"
            description="Essential features for your daily mental wellness journey"
            tools={CORE_TOOLS}
          />
        </div>
      </FadeIn>

      {/* Guidance Engines Section */}
      <FadeIn delay={0.2}>
        <ToolGrid
          title="Guidance Engines"
          description="Specialized assistants for different life situations"
          tools={GUIDANCE_TOOLS}
        />
      </FadeIn>

      {/* Karma & Growth Section */}
      <FadeIn delay={0.25}>
        <ToolGrid
          title="Karma & Growth"
          description="Track progress and process emotions with guided flows"
          tools={KARMA_TOOLS}
        />
      </FadeIn>

      {/* Quick Access Section */}
      <FadeIn delay={0.3}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-orange-50">Quick Access</h2>
              <HelpIcon content="Settings, subscription, and more" />
            </div>
          </div>
          <QuickLinks tools={QUICK_ACCESS_TOOLS} />
        </section>
      </FadeIn>

      {/* Chat and Journal Section */}
      <FadeIn delay={0.35}>
        <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]" id="chat">
          <article className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-orange-50">Guided chat</h2>
                <HelpIcon content="Calm, server-backed responses with context awareness" />
              </div>
              <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Secure</span>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-slate-950/60 p-4">
              <Chat />
            </div>
          </article>

          <article className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]" id="journal">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-orange-50">Encrypted journal</h2>
                <HelpIcon content="AES-GCM encryption keeps entries local and private" />
              </div>
              <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Local only</span>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-slate-950/60 p-4">
              <JournalEncrypted />
            </div>
          </article>
        </section>
      </FadeIn>
    </main>
  )
}
