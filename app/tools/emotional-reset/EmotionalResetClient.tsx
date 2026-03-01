'use client'

import { useRouter } from 'next/navigation'
import { EmotionalResetWizard } from '@/components/emotional-reset'
import { ToolActionCard } from '@/components/tools'
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
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#050507] to-[#120907] text-white p-4 md:p-8">
      {/* Subtle sacred background gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-gradient-to-br from-[#d4a44c]/15 via-[#e8b54a]/8 to-transparent blur-[100px]" />
        <div className="absolute bottom-20 right-0 h-80 w-80 rounded-full bg-gradient-to-tr from-[#d4a44c]/10 via-[#c8943a]/5 to-transparent blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6 relative">
        {/* Header — Divine Emotional Companion */}
        <FadeIn>
          <div className="flex items-center gap-4 mb-2">
            <div className="divine-companion-avatar h-14 w-14 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">&#x1F4AB;</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold kiaan-text-golden">Emotional Reset</h1>
              <p className="text-[11px] text-[#d4a44c]/50 tracking-[0.12em] uppercase mt-0.5">A sacred space, guided by KIAAN</p>
            </div>
          </div>
          <div className="divine-sacred-thread w-full my-4" />
          <p className="text-sm text-[#f5f0e8]/60 font-sacred leading-relaxed mb-2">
            A calming 7-step sacred flow to process emotions, find inner peace, and restore your spirit with gentle, divine guidance.
          </p>
          <a href="/dashboard" className="text-xs text-[#d4a44c]/50 hover:text-[#d4a44c]/70 transition">
            &larr; Back to dashboard
          </a>
        </FadeIn>

        {/* Quick Actions — Sacred Paths */}
        <FadeIn delay={0.05}>
          <div className="grid gap-4 md:grid-cols-2">
            <ToolActionCard
              icon="🧘"
              title="Begin Sacred Reset Flow"
              description="A guided 7-step journey to process and release emotions (~10 minutes)."
              ctaLabel="Begin Now"
              onClick={() => document.getElementById('reset-wizard')?.scrollIntoView({ behavior: 'smooth' })}
              gradient="from-[#d4a44c]/10 to-amber-500/10"
            />
            <ToolActionCard
              icon="🕊️"
              title="Quick Sacred Breathing"
              description="A 60-second breathing reset for immediate calm and peace."
              ctaLabel="Start Breathing"
              href="/tools/emotional-reset#reset-wizard"
              gradient="from-[#d4a44c]/8 to-[#e8b54a]/8"
            />
          </div>
        </FadeIn>

        {/* Main Wizard */}
        <FadeIn delay={0.1}>
          <div id="reset-wizard">
            <EmotionalResetWizard
              onComplete={handleComplete}
              onClose={handleClose}
              className="shadow-[0_20px_80px_rgba(212,164,76,0.12)]"
            />
          </div>
        </FadeIn>

        {/* Footer info — gentle sacred notes */}
        <FadeIn delay={0.2}>
          <div className="divine-step-card rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#f5f0e8]/50">
              <span className="flex items-center gap-1.5">
                <span className="divine-diya h-1.5 w-1.5 rounded-full bg-[#e8b54a]" aria-hidden="true"></span>
                Max 10 sacred sessions/day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d4a44c]/60" aria-hidden="true"></span>
                Sessions held for 30 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c8943a]/60" aria-hidden="true"></span>
                Progress preserved with care
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
