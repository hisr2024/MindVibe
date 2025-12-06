'use client'

import { KiaanLogo } from '@/src/components/KiaanLogo'
import { FadeIn } from '@/components/ui'
import { ToolGrid, QuickLinks } from '@/components/dashboard'
import {
  CORE_TOOLS,
  GUIDANCE_TOOLS,
  KARMA_TOOLS,
  QUICK_ACCESS_TOOLS,
} from '@/lib/constants/tools'

export default function DashboardClient() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
      <FadeIn>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-6 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
          <div className="flex items-center gap-4">
            <KiaanLogo size="md" className="shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">Dashboard</p>
              <h1 className="text-3xl font-bold text-orange-50">MindVibe tools</h1>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div id="tools" className="space-y-6">
          <ToolGrid title="Core Tools" tools={CORE_TOOLS} />
          <ToolGrid title="Guidance Engines" tools={GUIDANCE_TOOLS} />
          <ToolGrid title="Karma & Growth" tools={KARMA_TOOLS} />
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <h2 className="mb-3 text-xl font-semibold text-orange-50">Quick Access</h2>
          <QuickLinks tools={QUICK_ACCESS_TOOLS} />
        </section>
      </FadeIn>
    </main>
  )
}
