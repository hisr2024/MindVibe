'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EmotionalResetWizard } from '@/components/emotional-reset'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { FadeIn } from '@/components/ui'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import CompanionCTA from '@/components/companion/CompanionCTA'

export default function EmotionalResetClient() {
  const router = useRouter()

  const handleComplete = () => {
    // Session completed successfully
  }

  const handleClose = () => {
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#120907] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <FadeIn>
          <ToolHeader
            icon="💫"
            title="Emotional Reset"
            subtitle="A calming 7-step flow to process emotions, find inner peace, and restore your spirit with gentle guidance."
            backLink={{ label: 'Back to dashboard', href: '/dashboard' }}
          />
        </FadeIn>

        {/* Quick Actions */}
        <FadeIn delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2">
            <ToolActionCard
              icon="🧘"
              title="Start Full Reset Flow"
              description="Begin the guided 7-step emotional processing journey (~10 minutes)."
              ctaLabel="Begin Now"
              onClick={() => document.getElementById('reset-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              gradient="from-orange-500/10 to-amber-500/10"
            />
            <ToolActionCard
              icon="⏱️"
              title="Quick Breathing Exercise"
              description="A 60-second breathing reset for immediate calm."
              ctaLabel="Start Breathing"
              href="/tools/emotional-reset#reset-wizard"
              gradient="from-blue-500/10 to-cyan-500/10"
            />
          </div>
        </FadeIn>

        {/* Main Wizard */}
        <FadeIn delay={0.1}>
          <div id="reset-wizard">
            <EmotionalResetWizard
              onComplete={handleComplete}
              onClose={handleClose}
              className="shadow-[0_20px_80px_rgba(255,115,39,0.12)]"
            />
          </div>
        </FadeIn>

        {/* Footer info */}
        <FadeIn delay={0.2}>
          <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-orange-100/60">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden="true"></span>
                Max 10 sessions/day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" aria-hidden="true"></span>
                Sessions expire after 30 min
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true"></span>
                Progress saved automatically
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Talk to KIAAN */}
        <FadeIn delay={0.2}>
          <CompanionCTA fromTool="emotional-reset" />
        </FadeIn>

        {/* Spiritual Tools Navigation */}
        <FadeIn delay={0.25}>
          <SpiritualToolsNav currentTool="emotional-reset" />
        </FadeIn>
      </div>
    </main>
  )
}
