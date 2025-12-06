'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { EmotionalResetWizard } from '@/components/emotional-reset'
import { ToolHeader, ToolActionCard } from '@/components/tools'
import { FadeIn } from '@/components/ui'

export default function EmotionalResetClient() {
  const router = useRouter()

  const handleComplete = () => {
    // Session completed successfully
    console.log('Emotional Reset session completed')
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
          subtitle="A calming 7-step flow to process emotions, find inner peace, and reset your mental state with timeless ancient wisdom."
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
              href="/tools/viyog#clarity-pause"
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

        {/* Additional Resources */}
        <FadeIn delay={0.25}>
          <div className="rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5">
            <h3 className="text-sm font-semibold text-orange-50 mb-3">Related Tools</h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/tools/viyog"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-3 py-1.5 border border-orange-500/20"
              >
                Viyoga - Detachment Coach
              </Link>
              <Link
                href="/emotional-reset"
                className="text-xs text-orange-100/70 hover:text-orange-200 transition rounded px-3 py-1.5 border border-orange-500/20"
              >
                Original Page
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </main>
  )
}
