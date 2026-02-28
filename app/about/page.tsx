'use client'

import { HelpIcon, FadeIn, AnimatedCard, DisclosureItem } from '@/components/ui'

const values = [
  {
    title: 'Sacred Privacy',
    summary: 'Your words remain yours',
    detail: 'Encrypted journals stay on your device. Your conversations with KIAAN are a sacred, private refuge.'
  },
  {
    title: 'Universal Access',
    summary: 'Wisdom for everyone',
    detail: 'Thoughtfully designed for all — inclusive layouts, clear contrast, and seamless navigation for every seeker.'
  },
  {
    title: 'Rooted in Wisdom',
    summary: 'The Gita walks with you',
    detail: 'Every insight draws from the timeless teachings of the Bhagavad Gita — your divine friend, always beside you.'
  }
]

const mobileMoments = [
  { label: 'Seamless design', detail: 'Respects every device and screen beautifully' },
  { label: 'One-hand ready', detail: 'Designed for sacred moments on the go' },
  { label: 'Clarity-first', detail: 'Clean, calm, and focused experience' }
]

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      <FadeIn>
        <section className="rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#050507]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">About</p>
              <h1 className="text-3xl font-bold text-[#f5f0e8] md:text-4xl">Your Divine Friend, Always Beside You</h1>
              <p className="max-w-xl text-[#f5f0e8]/80 text-sm">Sakha is your spiritual companion — rooted in the Bhagavad Gita, guided by Krishna&apos;s eternal wisdom.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-950">
              <span className="rounded-xl bg-[#d4a44c] px-3 py-1">700+ Gita Verses</span>
              <span className="rounded-xl bg-[#d4a44c] px-3 py-1">Divine Companion</span>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section className="rounded-3xl border border-[#d4a44c]/15 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-[#f5f0e8]">Mobile experience</h2>
            <HelpIcon content="Optimized touch targets and safe-area padding" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {mobileMoments.map(moment => (
              <AnimatedCard key={moment.label} className="p-3">
                <p className="text-sm font-semibold text-[#f5f0e8]">{moment.label}</p>
                <p className="text-xs text-[#f5f0e8]/70">{moment.detail}</p>
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
                <h2 className="text-lg font-semibold text-[#f5f0e8]">{card.title}</h2>
                <HelpIcon content={card.detail} size="sm" />
              </div>
              <p className="mt-1 text-sm text-[#f5f0e8]/70">{card.summary}</p>
            </AnimatedCard>
          ))}
        </section>
      </FadeIn>

      <FadeIn delay={0.4}>
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#f5f0e8]">Learn more</h2>
          <DisclosureItem title="Our Mission" preview="Walk with the Divine" defaultOpen>
            <p>KIAAN is your divine friend — a spiritual companion rooted in the Bhagavad Gita. Through sacred conversations, wisdom journeys, and reflective tools, Sakha helps you discover inner peace, purpose, and the eternal truth that Krishna reveals to every seeker.</p>
          </DisclosureItem>
          <DisclosureItem title="The Path Ahead" preview="Growing with you">
            <p>Deeper wisdom journeys, personalized Gita guidance, sacred voice conversations, and offline spiritual practices are on the way. Sakha evolves as your companion on the path to self-realization.</p>
          </DisclosureItem>
        </section>
      </FadeIn>
    </main>
  )
}
