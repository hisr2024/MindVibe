'use client'

import Link from 'next/link'
import { ToolHeader, ToolActionCard, KarmicTreeClient } from '@/components/tools'
import { FadeIn } from '@/components/ui'

export default function KarmicTreePageClient() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn>
          <ToolHeader
            icon="🌱"
            title="Karmic Tree"
            subtitle="Track achievements, unlock mindful rewards, and visualize your growth journey with MindVibe."
            backLink={{ label: 'Back to home', href: '/' }}
          />
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn delay={0.05}>
          <div className="grid gap-4 md:grid-cols-3">
            <ToolActionCard
              icon="📝"
              title="Journal Entry"
              description="Add a reflection to earn XP and grow your tree."
              ctaLabel="Write Now"
              href="/sacred-reflections"
              gradient="from-orange-500/10 to-amber-500/10"
            />
            <ToolActionCard
              icon="👣"
              title="Analyze Karma"
              description="Reflect on your day for karma footprint insights."
              ctaLabel="Start Analysis"
              href="/tools/karma-footprint"
              gradient="from-lime-500/10 to-green-500/10"
            />
            <ToolActionCard
              icon="💬"
              title="Chat with KIAAN"
              description="Have a guided conversation to earn achievements."
              ctaLabel="Open Chat"
              href="/kiaan"
              gradient="from-blue-500/10 to-purple-500/10"
            />
          </div>
        </FadeIn>

        {/* Main Tree Visualization */}
        <FadeIn delay={0.1}>
          <KarmicTreeClient />
        </FadeIn>

        {/* Footer Links */}
        <FadeIn delay={0.15}>
          <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/karmic-tree"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-3 py-1.5 border border-orange-500/20"
              >
                Original Karmic Tree Page
              </Link>
              <Link
                href="/tools/karma-footprint"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-3 py-1.5 border border-orange-500/20"
              >
                Karma Footprint
              </Link>
              <Link
                href="/tools/emotional-reset"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-3 py-1.5 border border-orange-500/20"
              >
                Emotional Reset
              </Link>
              <Link
                href="/dashboard"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-3 py-1.5 border border-orange-500/20"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  )
}
