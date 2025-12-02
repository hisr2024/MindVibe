'use client'

import { HoverCard, HoverCardTitle, HoverCardDescription, HelpIcon, AnimatedCard, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui'

export default function FeaturesPage() {
  const featureCards = [
    {
      title: 'KIAAN guidance',
      summary: 'Warm, grounded responses',
      detail: 'Built-in clarity pauses and relationship support help you navigate difficult moments with equanimity.',
    },
    {
      title: 'Encrypted journal',
      summary: 'AES-GCM encryption',
      detail: 'Your reflections stay on your device with a local passphrase—no server ever sees your entries.',
    },
    {
      title: 'Dashboards',
      summary: 'Track mood & progress',
      detail: 'Gentle charts ready for integrations let you see patterns without feeling overwhelmed.',
    },
    {
      title: 'Accessibility',
      summary: 'WCAG compliant',
      detail: 'Color contrast, focus rings, motion respect, and semantic HTML ensure everyone can use MindVibe.',
    },
    {
      title: 'PWA ready',
      summary: 'Install anywhere',
      detail: 'Manifest and icons keep the app installable and offline-friendly on any device.',
    },
    {
      title: 'Security first',
      summary: 'Privacy by default',
      detail: 'No tracking ads, clear disclaimers, and privacy-first architecture protect your peace of mind.',
    }
  ]

  const mobilePatterns = [
    {
      title: 'Thumb-first',
      detail: 'Sticky actions and stacked cards for one-hand use'
    },
    {
      title: 'Readable',
      detail: 'Short lines, calm contrast, responsive type'
    },
    {
      title: 'Offline-ready',
      detail: 'PWA shell keeps rituals close'
    }
  ]

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      <FadeIn>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Features</p>
              <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Tools for mindful support</h1>
              <p className="max-w-2xl text-orange-100/80 text-sm">Modular, mobile-ready, and built for growth.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-100/80">
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-100">PWA</span>
              <HelpIcon content="Install on your device for offline access and faster performance" />
            </div>
          </div>
        </section>
      </FadeIn>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map(card => (
          <StaggerItem key={card.title}>
            <HoverCard
              trigger={
                <AnimatedCard className="h-full cursor-pointer">
                  <h2 className="text-lg font-semibold text-orange-50">{card.title}</h2>
                  <p className="mt-1 text-sm text-orange-100/70">{card.summary}</p>
                </AnimatedCard>
              }
            >
              <HoverCardTitle>{card.title}</HoverCardTitle>
              <HoverCardDescription>{card.detail}</HoverCardDescription>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.3}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-50">Mobile patterns</h3>
            <HelpIcon content="Optimized for one-hand use with safe-area padding" side="left" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {mobilePatterns.map(pattern => (
              <div key={pattern.title} className="rounded-2xl border border-orange-400/15 bg-white/5 p-3">
                <p className="text-sm font-semibold text-orange-50">{pattern.title}</p>
                <p className="text-xs text-orange-100/70">{pattern.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.4}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-orange-50">Performance</h3>
            <HelpIcon content="Optimized imagery, lazy loading, and mobile-first breakpoints" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">Lazy loading</span>
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">SEO metadata</span>
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">Responsive</span>
          </div>
        </section>
      </FadeIn>
    </main>
  )
}
