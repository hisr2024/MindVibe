'use client'

import Link from 'next/link'
import { HoverCard, HoverCardTitle, HoverCardDescription, HelpIcon, AnimatedCard, FadeIn, StaggerContainer, StaggerItem } from '@/components/ui'

// Feature cards with visual placeholders (5 cards)
const featureCards = [
  {
    title: 'KIAAN Emotional Reset',
    summary: '7-step guided wellness',
    detail: 'Process emotions, find calm, and reset your mental state with Gita wisdom in a guided 7-step flow with breathing exercises.',
    icon: '🕉️',
    videoPlaceholder: '🧘',
    featured: true,
  },
  {
    title: 'KIAAN Wisdom',
    summary: 'Warm, grounded guidance',
    detail: 'Built-in clarity pauses and relationship support help you navigate difficult moments with equanimity. Powered by timeless wisdom from the Bhagavad Gita.',
    icon: '💬',
    videoPlaceholder: '🎬',
  },
  {
    title: 'Private Journals',
    summary: 'AES-GCM encrypted',
    detail: 'Your reflections stay on your device with a local passphrase—no server ever sees your entries. Save KIAAN insights directly to your journal.',
    icon: '🔐',
    videoPlaceholder: '📝',
  },
  {
    title: 'Growth Analytics',
    summary: 'Track your journey',
    detail: 'Watch your Karmic Tree bloom as you grow. Visual analytics show your progress without feeling overwhelming.',
    icon: '🌳',
    videoPlaceholder: '📊',
  },
  {
    title: 'Mood Tracking',
    summary: 'Empathetic check-ins',
    detail: 'Gentle mood tracking with empathetic KIAAN responses. See patterns and receive warm support wherever you are.',
    icon: '😊',
    videoPlaceholder: '💙',
  },
]

// How it works - 3 simple steps
const howItWorks = [
  {
    step: 1,
    title: 'Check In',
    description: 'Share how you\'re feeling with a quick mood capture. KIAAN responds with warmth and understanding.',
    icon: '🌟',
  },
  {
    step: 2,
    title: 'Get Support',
    description: 'Talk to KIAAN for grounded guidance rooted in timeless wisdom. Save insights to your journal.',
    icon: '💬',
  },
  {
    step: 3,
    title: 'Track Growth',
    description: 'Watch your Karmic Tree bloom as you reflect, journal, and grow on your wellness journey.',
    icon: '🌱',
  },
]

// Flow pages for exploring different features
const flowPages = [
  { href: '/emotional-reset', title: 'Emotional Reset', detail: '7-step guided wellness flow with Gita wisdom' },
  { href: '/flows/check-in', title: 'State check-in', detail: 'Quick mood capture with empathetic responses' },
  { href: '/flows/kiaan', title: 'Talk to KIAAN', detail: 'Chat with clarity pause watch' },
  { href: '/flows/ardha', title: 'Ardha reframing', detail: 'Reframes with validation and steps' },
  { href: '/flows/viyog', title: 'Viyog outcome reducer', detail: 'Detachment coaching' },
  { href: '/flows/journal', title: 'Private journal', detail: 'AES-GCM encrypted storage' },
]

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      {/* Hero Section */}
      <FadeIn>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3 text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Features & Flows</p>
              <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Your Personal Wellness Companion</h1>
              <p className="max-w-2xl text-orange-100/80 text-sm">Everything you need for your mental wellness journey—empathetic, mobile-ready, and built with care.</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-orange-100/80 md:justify-start">
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
            {howItWorks.map(({ step, title, description, icon }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-2xl font-bold text-slate-900 shadow-lg shadow-orange-500/25">
                  {icon}
                </div>
                <div className="text-xs text-orange-100/60 mb-1">Step {step}</div>
                <h3 className="text-base font-semibold text-orange-50 mb-1">{title}</h3>
                <p className="text-sm text-orange-100/70">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Feature Cards with Visual Demos (4 cards) */}
      <FadeIn delay={0.2}>
        <section>
          <h2 className="text-lg font-semibold text-orange-50 mb-4 text-center">Core Features</h2>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map(card => (
              <StaggerItem key={card.title}>
                <HoverCard
                  trigger={
                    <AnimatedCard className="h-full cursor-pointer">
                      <div className="flex flex-col items-center text-center">
                        {/* Visual demo placeholder */}
                        <div className="mb-3 h-24 w-full rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center text-4xl">
                          {card.videoPlaceholder}
                        </div>
                        <span className="text-2xl mb-2">{card.icon}</span>
                        <h2 className="text-lg font-semibold text-orange-50">{card.title}</h2>
                        <p className="mt-1 text-sm text-orange-100/70">{card.summary}</p>
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
        </section>
      </FadeIn>

      {/* Explore Flows - Quick Navigation */}
      <FadeIn delay={0.3}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h3 className="text-lg font-semibold text-orange-50 mb-4">Explore Flows</h3>
          <p className="text-sm text-orange-100/70 mb-4">Dive deeper into specific wellness experiences</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flowPages.map(page => (
              <Link
                key={page.href}
                href={page.href}
                className="rounded-2xl border border-orange-500/20 bg-black/50 p-4 shadow-sm transition hover:border-orange-300/70 hover:shadow-orange-500/10 hover:scale-[1.02]"
              >
                <h4 className="text-sm font-semibold text-orange-50">{page.title}</h4>
                <p className="mt-1 text-xs text-orange-100/70">{page.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* Karmic Tree CTA */}
      <FadeIn delay={0.35}>
        <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-emerald-950/30 to-orange-950/30 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-orange-50 flex items-center gap-2">
                <span>🌳</span> Watch Your Growth
              </h3>
              <p className="text-sm text-orange-100/70 mt-1">
                Your Karmic Tree reflects your wellness journey. See it bloom as you check in, journal, and grow.
              </p>
            </div>
            <Link
              href="/karmic-tree"
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] whitespace-nowrap text-center"
            >
              View Karmic Tree
            </Link>
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
