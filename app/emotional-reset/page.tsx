'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EmotionalResetWizard } from '@/components/emotional-reset'
import { FadeIn } from '@/components/ui'
import { PathwayMap } from '@/components/navigation/PathwayMap'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'

export default function EmotionalResetPage() {
  const router = useRouter()

  const handleComplete = () => {
    // Session completed successfully
  }

  const handleClose = () => {
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-8 pb-28 sm:pb-20 md:pb-10">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Pathway Map */}
        <PathwayMap />

        {/* Header */}
        <FadeIn>
          <header className="rounded-2xl sm:rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-4 sm:p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">KIAAN Guided Flow</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
                  Emotional Reset
                </h1>
                <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
                  A calming 7-step flow to process emotions, find inner peace, and reset your state with timeless Gita wisdom.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50">
                  🕐 ~10 minute practice
                </span>
                <Link href="/dashboard" className="text-xs text-orange-100/70 hover:text-orange-200 transition">
                  ← Back to dashboard
                </Link>
              </div>
            </div>
          </header>
        </FadeIn>

        {/* Main Content: Wizard + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4 sm:space-y-6">
            {/* Main Wizard */}
            <FadeIn delay={0.1}>
              <EmotionalResetWizard
                onComplete={handleComplete}
                onClose={handleClose}
                className="shadow-[0_20px_80px_rgba(255,115,39,0.12)]"
              />
            </FadeIn>

            {/* Footer info */}
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-orange-100/60">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    Max 10 sessions/day
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                    Sessions expire after 30 min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                    Progress saved automatically
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Sidebar: Spiritual Tools Navigation */}
          <aside className="space-y-4">
            <FadeIn delay={0.15}>
              <SpiritualToolsNav currentTool="emotional-reset" />
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-4">
                <p className="text-xs text-orange-100/80 leading-relaxed">
                  <strong className="text-orange-50">After your reset:</strong> Continue your journey — explore Viyoga for detachment practice, Ardha to reframe lingering thoughts, or talk to KIAAN for deeper guidance.
                </p>
              </div>
            </FadeIn>
          </aside>
        </div>
      </div>
    </main>
  )
}
