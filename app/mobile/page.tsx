export const metadata = {
  title: 'MindVibe Mobile Preview',
  description: 'Touch-first rendering that mirrors a future React Native experience.',
}

const highlights = [
  'Adaptive typography and spacing tuned for small screens.',
  'Offline-friendly journaling and crisis resources one tap away.',
  'Semantic landmarks and aria labels optimized for screen readers on mobile.',
]

export default function MobileShowcase() {
  return (
    <main className="mx-auto max-w-xl space-y-6 bg-slate-950 px-6 pb-16 pt-10 text-slate-50" aria-label="Mobile-first preview">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-200/80">Mobile</p>
        <h1 className="text-3xl font-bold leading-tight">MindVibe Mobile</h1>
        <p className="text-sm leading-relaxed text-slate-200">
          A focused, touch-ready layout that mirrors the web experience while keeping room for native builds.
        </p>
      </header>

      <section className="flex flex-wrap gap-2" aria-label="Mobile capability badges">
        {highlights.map(item => (
          <div
            key={item}
            className="rounded-full border border-orange-400/50 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-50"
            role="listitem"
          >
            {item}
          </div>
        ))}
      </section>

      <section className="space-y-4" aria-labelledby="mobile-panels-heading">
        <h2 id="mobile-panels-heading" className="text-lg font-semibold">
          Guided mobile flows
        </h2>

        <article
          className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-orange-500/10"
          aria-label="Mobile insights panel"
        >
          <h3 className="text-base font-semibold text-orange-100">Daily check-in</h3>
          <p className="text-sm text-slate-200">
            Quick mood sliders, privacy-safe notes, and gentle reminders adapt to mobile ergonomics with large tap
            targets and reduced motion.
          </p>
        </article>

        <article
          className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-orange-500/10"
          aria-label="Coach capsule"
        >
          <h3 className="text-base font-semibold text-orange-100">Coach capsule</h3>
          <p className="text-sm text-slate-200">
            Bite-sized goals, crisis guardrails, and offline resilience prepare us for React Native parity without
            rewriting journeys.
          </p>
        </article>
      </section>
    </main>
  )
}
