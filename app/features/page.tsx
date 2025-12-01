import AccessibilityChecklist from '../components/AccessibilityChecklist'

export const metadata = {
  title: 'Features | MindVibe',
  description: 'Explore journaling, guided chats, dashboards, and accessibility-first design for calmer support.'
}

const featureCards = [
  {
    title: 'KIAAN guidance',
    detail: 'Warm, grounded responses with built-in clarity pauses and relationship support.',
  },
  {
    title: 'Encrypted journal',
    detail: 'AES-GCM encryption with a local passphrase keeps reflections on your device.',
  },
  {
    title: 'Dashboards',
    detail: 'Track mood, routines, and progress with gentle charts ready for integrations.',
  },
  {
    title: 'Accessibility',
    detail: 'Color contrast, focus rings, motion respect, and semantic HTML for WCAG alignment.',
  },
  {
    title: 'PWA ready',
    detail: 'Manifest and icons keep the app installable and offline-friendly.',
  },
  {
    title: 'Security first',
    detail: 'Privacy-first defaults, no tracking ads, and clear disclaimers.',
  }
]

const mobilePatterns = [
  {
    title: 'Thumb-first layouts',
    detail: 'Sticky actions, stacked cards, and breathing space tuned for one-hand use.'
  },
  {
    title: 'Ultra-readable text',
    detail: 'Short line lengths, calm contrast, and responsive typography that never crowds.'
  },
  {
    title: 'Offline-friendly',
    detail: 'Installable PWA shell with resilient fallbacks so the rituals stay close.'
  }
]

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 mobile-safe-padding">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Features</p>
            <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">Professional tools for mindful support</h1>
            <p className="max-w-3xl text-orange-100/80 text-sm md:text-base">Guided chats, calming exercises, and secure journaling—each module stays modular and ready for growth, even on the smallest screens.</p>
          </div>
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-orange-400/20 bg-black/30 p-4 text-sm text-orange-100/80 shadow-lg shadow-orange-500/10 md:max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-orange-100/70">Mobile ready</span>
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-[11px] font-semibold text-orange-100">PWA</span>
            </div>
            <p className="leading-relaxed">Thumb-friendly grids, safe-area padding, and tappable actions keep the experience calm and precise.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 md:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-orange-50">Built for your phone</h2>
          <span className="rounded-full border border-orange-400/30 px-3 py-1 text-[11px] text-orange-100">Swipe to browse</span>
        </div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {featureCards.map(card => (
            <article
              key={card.title}
              className="min-w-[260px] snap-center rounded-3xl border border-orange-500/15 bg-black/50 p-5 shadow-[0_12px_48px_rgba(255,115,39,0.14)]"
            >
              <h2 className="text-lg font-semibold text-orange-50">{card.title}</h2>
              <p className="mt-2 text-sm text-orange-100/80 leading-relaxed">{card.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {featureCards.map(card => (
          <article key={card.title} className="hidden rounded-3xl border border-orange-500/15 bg-black/40 p-6 shadow-[0_10px_40px_rgba(255,115,39,0.12)] md:block">
            <h2 className="text-xl font-semibold text-orange-50">{card.title}</h2>
            <p className="mt-2 text-sm text-orange-100/80">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 rounded-3xl border border-orange-500/15 bg-black/40 p-6 md:grid-cols-3 md:items-start md:gap-6">
        {mobilePatterns.map(pattern => (
          <article key={pattern.title} className="rounded-2xl border border-orange-400/15 bg-white/5 p-4 shadow-[0_10px_36px_rgba(255,115,39,0.12)]">
            <h3 className="text-base font-semibold text-orange-50">{pattern.title}</h3>
            <p className="mt-1 text-sm text-orange-100/80 leading-relaxed">{pattern.detail}</p>
          </article>
        ))}
        <div className="rounded-2xl bg-gradient-to-r from-orange-500/20 via-[#ffb347]/20 to-orange-200/10 p-4 text-sm text-orange-50 shadow-[0_12px_48px_rgba(255,115,39,0.18)] md:col-span-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/80">Quick actions</p>
              <p className="text-base font-semibold">Chat, pause, or journal in two taps.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-slate-950">
              <span className="rounded-xl bg-orange-200 px-3 py-1 text-xs font-semibold">Haptics ready</span>
              <span className="rounded-xl bg-orange-100 px-3 py-1 text-xs font-semibold">Safe-area aware</span>
              <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold">ADA-friendly</span>
            </div>
          </div>
        </div>
      </section>

      <AccessibilityChecklist />

      <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
        <h3 className="text-lg font-semibold text-orange-50">Performance & SEO</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-orange-100/80">
          <li>Optimized imagery and lazy loading for faster render times.</li>
          <li>Per-page metadata for discoverability and shareable deep links.</li>
          <li>Responsive layouts with mobile-first breakpoints.</li>
        </ul>
      </section>
    </main>
  )
}
