import Link from 'next/link'

const insightTools = [
  {
    href: '/ardha',
    title: 'Ardha',
    description: 'Reframe spiraling thoughts with calm, Gita-aligned perspective.',
  },
  {
    href: '/viyog',
    title: 'Vyyoga',
    description: 'Release outcome anxiety and return to one grounded action.',
  },
  {
    href: '/relationship-compass',
    title: 'Relationship Compass',
    description: 'Navigate tense conversations with clear, ego-light next steps.',
  },
]

export default function DeepInsightsPage() {
  return (
    <main className="mv-page relative min-h-screen p-4 md:p-8 pb-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/20 via-amber-400/10 to-transparent blur-3xl" />
        <div className="absolute right-6 bottom-10 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-400/20 via-teal-300/10 to-transparent blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-3 rounded-3xl border border-white/5 bg-[var(--brand-surface)]/80 p-6 md:p-10 shadow-[0_25px_120px_rgba(255,147,71,0.18)] backdrop-blur">
          <p className="text-sm text-white/70">Guided, high-focus tools</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Deep Insights</h1>
          <p className="max-w-2xl text-base text-white/70">
            Explore focused companions designed for reframing, detachment, and relationship clarity. Each module opens its own
            dedicated workspace—clean, fast, and ready to use.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Deep Insights tools">
          {insightTools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-5 shadow-[0_18px_70px_rgba(255,147,71,0.14)] transition hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{tool.title}</h2>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">Open</span>
                </div>
                <p className="text-sm text-white/70">{tool.description}</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-orange-200">
                <span>Launch</span>
                <span aria-hidden>→</span>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
