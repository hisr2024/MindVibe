'use client'

import Link from 'next/link'
import { ToolHeader, ToolActionCard, KarmicTreeClient } from '@/components/tools'
import { FadeIn } from '@/components/ui'
import CompanionCTA from '@/components/companion/CompanionCTA'

export default function KarmicTreePageClient() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#050714] to-[#120907] px-page-x py-4 md:py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn>
          <ToolHeader
            icon="🌱"
            title="Karmic Tree"
            subtitle="Track achievements, unlock mindful rewards, and visualize your growth journey with Sakha."
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
              gradient="from-[#d4a44c]/10 to-amber-500/10"
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
              href="/kiaan/chat"
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
          <div
            className="p-4"
            style={{
              background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
              border: '1px solid rgba(212,160,23,0.1)',
              borderTop: '2px solid rgba(212,160,23,0.45)',
              borderRadius: '18px',
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/tools/karmic-tree"
                className="text-xs text-[#f5f0e8]/70 hover:text-[#e8b54a] transition rounded px-3 py-1.5 border border-[#d4a44c]/20"
              >
                Karmic Tree
              </Link>
              <Link
                href="/tools/karma-footprint"
                className="text-xs text-[#f5f0e8]/70 hover:text-[#e8b54a] transition rounded px-3 py-1.5 border border-[#d4a44c]/20"
              >
                Karma Footprint
              </Link>
              <Link
                href="/tools/emotional-reset"
                className="text-xs text-[#f5f0e8]/70 hover:text-[#e8b54a] transition rounded px-3 py-1.5 border border-[#d4a44c]/20"
              >
                Emotional Reset
              </Link>
              <Link
                href="/dashboard"
                className="text-xs text-[#f5f0e8]/70 hover:text-[#e8b54a] transition rounded px-3 py-1.5 border border-[#d4a44c]/20"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={0.2}>
          <CompanionCTA fromTool="karmic-tree" />
        </FadeIn>
      </div>
    </main>
  )
}
