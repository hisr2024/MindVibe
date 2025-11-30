export const metadata = {
  title: 'About MindVibe',
  description: 'Our mission is to deliver calm, privacy-first mental health support with ethical guardrails.'
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">About</p>
        <h1 className="text-3xl font-bold text-orange-50">Built for calm, trust, and safety</h1>
        <p className="mt-4 max-w-3xl text-orange-100/80">MindVibe pairs quiet guidance with strong privacy and accessible design, keeping every feature intentional.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[{
          title: 'Privacy-first',
          body: 'Encrypted journals stay on your device. Conversations avoid tracking and emphasize consent.',
        }, {
          title: 'Accessibility',
          body: 'Layouts, color contrast, and focus states are tuned for WCAG 2.1 AA friendliness.',
        }, {
          title: 'Ethical guardrails',
          body: 'We avoid medical claims, surface crisis disclaimers, and respect your agency.',
        }].map(card => (
          <div key={card.title} className="rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-[0_10px_40px_rgba(255,115,39,0.12)]">
            <h2 className="text-xl font-semibold text-orange-50">{card.title}</h2>
            <p className="mt-2 text-sm text-orange-100/80">{card.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h3 className="text-lg font-semibold text-orange-50">Mission</h3>
          <p className="mt-2 text-orange-100/80">Slow down, reflect, and act with intent. KIAAN leads the dialogue while tools like Clarity Pause and Ardha keep agency with you.</p>
        </div>
        <div className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
          <h3 className="text-lg font-semibold text-orange-50">Future vision</h3>
          <p className="mt-2 text-orange-100/80">Dashboards, insight integrations, and PWA support are on the way so your space grows with you.</p>
        </div>
      </section>
    </main>
  )
}
