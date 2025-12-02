'use client'

import Link from 'next/link'
import { HoverCard, HoverCardTitle, HoverCardDescription, HelpIcon, AnimatedCard, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui'

const featureCards = [
  {
    title: 'KIAAN guidance',
    summary: 'Warm, grounded responses',
    detail: 'Built-in clarity pauses and relationship support help you navigate difficult moments with equanimity.',
    icon: '💬',
  },
  {
    title: 'Encrypted journal',
    summary: 'AES-GCM encryption',
    detail: 'Your reflections stay on your device with a local passphrase—no server ever sees your entries.',
    icon: '🔐',
  },
  {
    title: 'Mood tracking',
    summary: 'Track your progress',
    detail: 'Gentle charts let you see patterns without feeling overwhelmed.',
    icon: '📊',
  },
  {
    title: 'Accessibility',
    summary: 'WCAG compliant',
    detail: 'Color contrast, focus rings, motion respect, and semantic HTML ensure everyone can use MindVibe.',
    icon: '♿',
  },
  {
    title: 'PWA ready',
    summary: 'Install anywhere',
    detail: 'Manifest and icons keep the app installable and offline-friendly on any device.',
    icon: '📱',
  },
  {
    title: 'Security first',
    summary: 'Privacy by default',
    detail: 'No tracking ads, clear disclaimers, and privacy-first architecture protect your peace of mind.',
    icon: '🛡️',
  }
]

const howItWorks = [
  {
    step: 1,
    title: 'Check in',
    description: 'Share how you\'re feeling with a quick mood capture.',
  },
  {
    step: 2,
    title: 'Talk to KIAAN',
    description: 'Get warm, grounded guidance rooted in timeless wisdom.',
  },
  {
    step: 3,
    title: 'Reflect & grow',
    description: 'Journal your insights and track your progress.',
  },
]

const flowPages = [
  { href: '/flows/check-in', title: 'State check-in', detail: 'Quick mood capture with context' },
  { href: '/flows/kiaan', title: 'Talk to KIAAN', detail: 'Chat with clarity pause watch' },
  { href: '/flows/ardha', title: 'Ardha reframing', detail: 'Reframes with validation and steps' },
  { href: '/flows/viyog', title: 'Viyog outcome reducer', detail: 'Detachment coaching' },
  { href: '/flows/karma-reset', title: 'Karma reset', detail: 'Gentle course correction' },
  { href: '/flows/journal', title: 'Private journal', detail: 'AES-GCM encrypted storage' },
]

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      <FadeIn>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Features & Flows</p>
              <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Your mindful support toolkit</h1>
              <p className="max-w-2xl text-orange-100/80 text-sm">Everything you need for your mental wellness journey—modular, mobile-ready, and built with care.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-100/80">
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-100">PWA</span>
              <HelpIcon content="Install on your device for offline access" />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* How It Works - Simple 3-step flow */}
      <FadeIn delay={0.1}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h2 className="text-lg font-semibold text-orange-50 mb-6 text-center">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-xl font-bold text-slate-900">
                  {step}
                </div>
                <h3 className="text-base font-semibold text-orange-50 mb-1">{title}</h3>
                <p className="text-sm text-orange-100/70">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Feature Cards */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureCards.map(card => (
          <StaggerItem key={card.title}>
            <HoverCard
              trigger={
                <AnimatedCard className="h-full cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{card.icon}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-orange-50">{card.title}</h2>
                      <p className="mt-1 text-sm text-orange-100/70">{card.summary}</p>
                    </div>
                  </div>
                </AnimatedCard>
              }
            >
              <HoverCardTitle>{card.title}</HoverCardTitle>
              <HoverCardDescription>{card.detail}</HoverCardDescription>
            </HoverCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Flow Pages - Quick Navigation */}
      <FadeIn delay={0.3}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h3 className="text-lg font-semibold text-orange-50 mb-4">Explore Flows</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flowPages.map(page => (
              <Link
                key={page.href}
                href={page.href}
                className="rounded-2xl border border-orange-500/20 bg-black/50 p-4 shadow-sm transition hover:border-orange-300/70 hover:shadow-orange-500/10"
              >
                <h4 className="text-sm font-semibold text-orange-50">{page.title}</h4>
                <p className="mt-1 text-xs text-orange-100/70">{page.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Performance & Mobile */}
      <FadeIn delay={0.4}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-orange-50">Built for performance</h3>
            <HelpIcon content="Optimized imagery, lazy loading, and mobile-first design" />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">60fps animations</span>
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">Lazy loading</span>
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">Responsive</span>
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">Dark mode</span>
            <span className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">WCAG AA</span>
          </div>
        </section>
      </FadeIn>
    </main>
  )
}
