'use client'

import Chat from '../components/Chat'
import JournalEncrypted from '../components/JournalEncrypted'
import { HelpIcon, AnimatedCard, FadeIn, StaggerContainer, StaggerItem, HoverCard, HoverCardTitle, HoverCardDescription } from '@/components/ui'

export default function DashboardClient() {
  const shortcuts = [
    { href: '/flows/check-in', label: 'State check-in', hint: 'Capture your mood' },
    { href: '/flows/kiaan', label: 'KIAAN chat', hint: 'Guided conversation' },
    { href: '/flows/viyog', label: 'Outcome reducer', hint: 'Ease result anxiety' },
    { href: '/flows/journal', label: 'Private journal', hint: 'Encrypted notes' }
  ]

  const focusItems = [
    { title: 'Check in', body: 'Align the assistant tone', accent: 'bg-orange-400' },
    { title: 'Run a flow', body: 'Jump into any tool', accent: 'bg-amber-300' },
    { title: 'Save it', body: 'Quick encrypted notes', accent: 'bg-orange-200' }
  ]

  const features = [
    { title: 'Guided chat', summary: 'Calm assistant', detail: 'Stay in flow with context-aware responses and history.' },
    { title: 'Encrypted journal', summary: 'Local AES-GCM', detail: 'Notes stay private—no servers involved.' },
    { title: 'Flow launcher', summary: 'One-click flows', detail: 'Dedicated shortcuts for your favorite tools.' },
    { title: 'Focused layout', summary: 'High contrast', detail: 'Typography and spacing optimized for attention.' },
    { title: 'Mobile ready', summary: 'Stacks elegantly', detail: 'Work comfortably on any screen size.' },
    { title: 'Immediate context', summary: 'Priority first', detail: 'Important tasks surface right away.' }
  ]

  const kiaanHighlights = [
    { title: 'Ecosystem intact', body: 'All KIAAN pathways remain one tap away.' },
    { title: 'Reliability first', body: 'Shortcuts map directly to flows.' },
    { title: 'Speed maintained', body: 'Lean markup keeps it snappy.' }
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 lg:px-6">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
          <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.7fr,1fr] lg:items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-orange-100/80">
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-50">
                  Dashboard
                </span>
                <HelpIcon content="All data stays on your device with AES-GCM encryption" />
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold leading-tight text-orange-50 md:text-5xl">
                  Your control room
                </h1>
                <p className="max-w-2xl text-lg text-orange-100/85">
                  Launch flows, chat, and secure notes in one place.
                </p>
              </div>

            <div className="flex flex-wrap gap-3 text-sm font-semibold">
              <a
                href="#chat"
                className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 text-slate-900 shadow-orange-500/25"
              >
                Launch guided chat
              </a>
              <a href="#journal" className="rounded-2xl border border-orange-500/30 px-4 py-2 text-orange-50">
                Capture a private note
              </a>
              <a href="/flows/access" className="rounded-2xl border border-orange-500/20 px-4 py-2 text-orange-50">
                Explore all flows
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Realtime guidance", "Encrypted journaling", "Actionable shortcuts"].map((item) => (
                <span key={item} className="rounded-xl bg-orange-500/15 px-3 py-1 text-xs text-orange-100">{item}</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-orange-500/20 bg-black/50 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-orange-50">Shortcuts</h2>
              <HelpIcon content="Jump to any flow with one click" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {shortcuts.map(({ href, label, hint }) => (
                <HoverCard
                  key={href}
                  trigger={
                    <a href={href} className="group flex items-center justify-between rounded-2xl border border-orange-500/20 bg-black/40 px-4 py-3 text-sm font-semibold text-orange-50 transition hover:border-orange-400/50">
                      <span>{label}</span>
                      <span className="text-orange-200/90 transition group-hover:translate-x-0.5">→</span>
                    </a>
                  }
                >
                  <HoverCardTitle>{label}</HoverCardTitle>
                  <HoverCardDescription>{hint}</HoverCardDescription>
                </HoverCard>
              ))}
            </div>
          </div>
        </div>
      </section>
      </FadeIn>

      <StaggerContainer className="grid gap-6 lg:grid-cols-3">
        <StaggerItem>
          <AnimatedCard className="p-6 h-full">
            <h2 className="text-lg font-semibold text-orange-50 mb-4">Today&apos;s focus</h2>
            <ul className="space-y-2 text-sm text-orange-100/85">
              {focusItems.map(({ title, body, accent }) => (
                <li key={title} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${accent}`} />
                  <span className="font-semibold text-orange-50">{title}</span>
                  <span className="text-orange-100/60">·</span>
                  <span className="text-xs">{body}</span>
                </li>
              ))}
            </ul>
          </AnimatedCard>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <AnimatedCard className="p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-orange-50">Features</h2>
              <HelpIcon content="All features work offline and respect your privacy" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title, summary, detail }) => (
                <HoverCard
                  key={title}
                  trigger={
                    <div className="rounded-xl border border-orange-500/15 bg-slate-950/60 p-3 text-sm cursor-pointer hover:border-orange-400/40 transition">
                      <p className="font-semibold text-orange-50">{title}</p>
                      <p className="text-xs text-orange-100/70">{summary}</p>
                    </div>
                  }
                >
                  <HoverCardTitle>{title}</HoverCardTitle>
                  <HoverCardDescription>{detail}</HoverCardDescription>
                </HoverCard>
              ))}
            </div>
          </AnimatedCard>
        </StaggerItem>
      </StaggerContainer>

      <FadeIn delay={0.3}>
        <section className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-orange-50">KIAAN ecosystem</h2>
              <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Protected</span>
            </div>
            <HelpIcon content="All KIAAN pathways remain intact and forward-compatible" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {kiaanHighlights.map(({ title, body }) => (
              <AnimatedCard key={title} className="p-4">
                <p className="font-semibold text-orange-50">{title}</p>
                <p className="text-xs text-orange-100/70 mt-1">{body}</p>
              </AnimatedCard>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.4}>
        <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]" id="chat">
          <article className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-orange-50">Guided chat</h2>
                <HelpIcon content="Calm, server-backed responses with context awareness" />
              </div>
              <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Secure</span>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-slate-950/60 p-4">
              <Chat />
            </div>
          </article>

          <article className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]" id="journal">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-orange-50">Encrypted journal</h2>
                <HelpIcon content="AES-GCM encryption keeps entries local and private" />
              </div>
              <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Local only</span>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-slate-950/60 p-4">
              <JournalEncrypted />
            </div>
          </article>
        </section>
      </FadeIn>
    </main>
  )
}
