export const metadata = {
  title: 'Features | MindVibe',
  description: 'Explore journaling, guided chats, dashboards, and accessibility-first design for calmer support.'
}

const featureCards = [
  {
    title: 'KIAAN guidance',
    detail: 'Warm, grounded responses that keep agency with you. Includes clarity pauses and relationship support.',
  },
  {
    title: 'Encrypted journal',
    detail: 'AES-GCM encryption with a local passphrase so reflections remain on your device.',
  },
  {
    title: 'Dashboards',
    detail: 'Track mood, routines, and progress with gentle charts (ready for backend integrations).',
  },
  {
    title: 'Accessibility',
    detail: 'Color contrast, focus rings, reduced motion respect, and semantic HTML for WCAG 2.1 AA alignment.',
  },
  {
    title: 'PWA ready',
    detail: 'Manifest and icons for installable, offline-friendly experiences as features grow.',
  },
  {
    title: 'Security first',
    detail: 'Privacy-first defaults, no tracking ads, and clear disclaimers to keep expectations honest.',
  }
]

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Features</p>
        <h1 className="text-3xl font-bold text-orange-50">Professional tools for mindful support</h1>
        <p className="mt-4 max-w-3xl text-orange-100/80">
          Build your routine with guided chats, calming exercises, and secure journaling. Each feature is modular, so the app can
          grow into dashboards, integrations, and authenticated spaces.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {featureCards.map(card => (
          <article key={card.title} className="rounded-3xl border border-orange-500/15 bg-black/40 p-6 shadow-[0_10px_40px_rgba(255,115,39,0.12)]">
            <h2 className="text-xl font-semibold text-orange-50">{card.title}</h2>
            <p className="mt-2 text-sm text-orange-100/80">{card.detail}</p>
          </article>
        ))}
      </section>

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
