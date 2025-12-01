export const metadata = {
  title: 'About MindVibe',
  description: 'Our mission is to deliver calm, privacy-first mental health support with ethical guardrails.'
}

const values = [
  {
    title: 'Privacy-first',
    body: 'Encrypted journals stay on your device. Conversations avoid tracking and emphasize consent.'
  },
  {
    title: 'Accessibility',
    body: 'Layouts, color contrast, and focus states are tuned for WCAG 2.1 AA friendliness.'
  },
  {
    title: 'Ethical guardrails',
    body: 'We avoid medical claims, surface crisis disclaimers, and respect your agency.'
  }
]

const mobileMoments = [
  {
    label: 'Safe-area aware',
    detail: 'Navigation, chat, and journals respect notches and rounded corners.'
  },
  {
    label: 'Pocket friendly',
    detail: 'Stacked sections, concise headers, and tap targets inspired by best-in-class wellness apps.'
  },
  {
    label: 'Clarity-first',
    detail: 'Microcopy and breathable spacing keep the calm even on quick check-ins.'
  }
]

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">About</p>
            <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Built for calm, trust, and safety</h1>
            <p className="max-w-3xl text-orange-100/80 text-sm md:text-base">MindVibe pairs quiet guidance with strong privacy and accessible design, keeping every feature intentional—especially on mobile.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-950 md:flex-col md:items-end">
            <span className="rounded-xl bg-orange-200 px-3 py-1">Dark-mode native</span>
            <span className="rounded-xl bg-orange-100 px-3 py-1">Motion-aware</span>
            <span className="rounded-xl bg-white px-3 py-1">One-hand optimized</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-orange-500/15 bg-black/40 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-orange-50">Mobile moments</h2>
            <p className="text-sm text-orange-100/80">Borrowed from world-class apps—kept gentle and ethical.</p>
          </div>
          <span className="rounded-full border border-orange-400/30 px-3 py-1 text-[11px] text-orange-100">Feels native on iOS & Android</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {mobileMoments.map(moment => (
            <article key={moment.label} className="rounded-2xl border border-orange-400/15 bg-white/5 p-4">
              <p className="text-sm font-semibold text-orange-50">{moment.label}</p>
              <p className="mt-1 text-sm text-orange-100/80 leading-relaxed">{moment.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {values.map(card => (
          <div key={card.title} className="rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-[0_10px_40px_rgba(255,115,39,0.12)]">
            <h2 className="text-xl font-semibold text-orange-50">{card.title}</h2>
            <p className="mt-2 text-sm text-orange-100/80 leading-relaxed">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-orange-500/15 bg-black/40 p-6 space-y-2">
          <h3 className="text-lg font-semibold text-orange-50">Mission</h3>
          <p className="text-orange-100/80 text-sm md:text-base">Slow down, reflect, and act with intent. KIAAN leads the dialogue while tools like Clarity Pause and Ardha keep agency with you.</p>
          <p className="text-sm text-orange-100/70">On mobile, that means fewer taps, clearer guidance, and just-right friction before big decisions.</p>
        </div>
        <div className="rounded-3xl border border-orange-500/15 bg-black/40 p-6 space-y-2">
          <h3 className="text-lg font-semibold text-orange-50">Future vision</h3>
          <p className="text-orange-100/80 text-sm md:text-base">Dashboards, insight integrations, and PWA support are on the way so your space grows with you.</p>
          <p className="text-sm text-orange-100/70">Expect more mobile-native gestures, offline rituals, and gentle haptics as we evolve.</p>
        </div>
      </section>
    </main>
  )
}
