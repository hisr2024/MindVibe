'use client'

import { HelpIcon, FadeIn, AnimatedCard, Disclosure, DisclosureItem } from '@/components/ui'

const values = [
  {
    title: 'Privacy-first',
    summary: 'Your data stays yours',
    detail: 'Encrypted journals stay on your device. Conversations avoid tracking and emphasize consent.'
  },
  {
    title: 'Accessibility',
    summary: 'Designed for everyone',
    detail: 'Layouts, color contrast, and focus states are tuned for WCAG 2.1 AA compliance.'
  },
  {
    title: 'Ethical guardrails',
    summary: 'Mindful boundaries',
    detail: 'We avoid medical claims, surface crisis disclaimers, and respect your agency.'
  }
]

const mobileMoments = [
  { label: 'Safe-area aware', detail: 'Respects notches and rounded corners' },
  { label: 'Pocket friendly', detail: 'One-hand optimized layouts' },
  { label: 'Clarity-first', detail: 'Clean microcopy and spacing' }
]

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      <FadeIn>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">About</p>
              <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Calm, trust, and safety</h1>
              <p className="max-w-xl text-orange-100/80 text-sm">Quiet guidance with strong privacy and accessible design.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-950">
              <span className="rounded-xl bg-orange-200 px-3 py-1">Dark-mode native</span>
              <span className="rounded-xl bg-orange-100 px-3 py-1">Motion-aware</span>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-orange-50">Mobile experience</h2>
            <HelpIcon content="Optimized touch targets and safe-area padding" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {mobileMoments.map(moment => (
              <AnimatedCard key={moment.label} className="p-3">
                <p className="text-sm font-semibold text-orange-50">{moment.label}</p>
                <p className="text-xs text-orange-100/70">{moment.detail}</p>
              </AnimatedCard>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.3}>
        <section className="grid gap-6 md:grid-cols-3">
          {values.map(card => (
            <AnimatedCard key={card.title} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-orange-50">{card.title}</h2>
                <HelpIcon content={card.detail} size="sm" />
              </div>
              <p className="mt-1 text-sm text-orange-100/70">{card.summary}</p>
            </AnimatedCard>
          ))}
        </section>
      </FadeIn>

      <FadeIn delay={0.4}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-orange-50">Learn more</h2>
          <DisclosureItem title="Our Mission" preview="Slow down, reflect, act" defaultOpen>
            <p>KIAAN leads the dialogue while tools like Clarity Pause and Ardha keep agency with you. On mobile, that means fewer taps, clearer guidance, and just-right friction before big decisions.</p>
          </DisclosureItem>
          <DisclosureItem title="Future Vision" preview="Growing with you">
            <p>Dashboards, insight integrations, and PWA support are on the way. Expect more mobile-native gestures, offline rituals, and gentle haptics as we evolve.</p>
          </DisclosureItem>
        </section>
      </FadeIn>
    </main>
  )
}
