'use client'

import Chat from '../components/Chat'
import JournalEncrypted from '../components/JournalEncrypted'

export default function DashboardClient() {
  const shortcuts = [
    { href: '/flows/check-in', label: 'State check-in' },
    { href: '/flows/kiaan', label: 'KIAAN chat' },
    { href: '/flows/viyog', label: 'Outcome reducer' },
    { href: '/flows/journal', label: 'Private journal' }
  ]

  const focusItems = [
    {
      title: 'Check in',
      body: 'Capture your current state and align the assistant tone instantly.',
      accent: 'bg-orange-400'
    },
    {
      title: 'Run a flow',
      body: 'Jump into Access, KIAAN, or Outcome Reducer without leaving the dashboard.',
      accent: 'bg-amber-300'
    },
    {
      title: 'Save it',
      body: 'Drop quick thoughts into your encrypted journal for later review.',
      accent: 'bg-orange-200'
    }
  ]

  const features = [
    { title: 'Guided chat', body: 'Stay in flow with a calm assistant tuned for your context and history.' },
    { title: 'Encrypted journal', body: 'AES-GCM local storage keeps notes private—no servers involved.' },
    { title: 'Flow launcher', body: 'Dedicated shortcuts load your favorite flows with a single click.' },
    { title: 'Focused layout', body: 'High-contrast typography and spacing keep attention on the task.' },
    { title: 'Mobile ready', body: 'Cards stack elegantly so you can work comfortably on any screen.' },
    { title: 'Immediate context', body: 'Priority tasks surface here so you start with clarity.' }
  ]

  const kiaanHighlights = [
    {
      title: 'Ecosystem intact',
      body: 'All KIAAN pathways remain one tap away with consistent URLs and layout anchors.'
    },
    {
      title: 'Reliability first',
      body: 'Shortcuts and focus items are mapped directly to KIAAN flows to avoid regressions.'
    },
    {
      title: 'Speed maintained',
      body: 'Lean markup, fewer repeats, and responsive grids keep interactions snappy on any device.'
    }
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 pb-16 lg:px-6">
      <section className="relative overflow-hidden rounded-4xl border border-orange-500/15 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
        <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.7fr,1fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-orange-100/80">
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-50">
                Dashboard
              </span>
              <span className="text-xs font-semibold text-orange-100/70">Private & on-device first</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold leading-tight text-orange-50 md:text-5xl">
                Your world-class control room
              </h1>
              <p className="max-w-3xl text-lg text-orange-100/85">
                Start every session here. Launch flows, jump into chat, and secure your notes without wading through clutter.
                Everything is tuned for speed, clarity, and confidentiality.
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

            <div className="grid gap-3 sm:grid-cols-3">
              {["Realtime guidance", "Encrypted journaling", "Actionable shortcuts"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-orange-500/15 bg-black/40 px-4 py-3 text-sm font-semibold text-orange-50 shadow-[0_10px_40px_rgba(255,115,39,0.12)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-orange-500/20 bg-black/50 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Shortcuts</p>
                <h2 className="text-xl font-semibold text-orange-50">Jump anywhere instantly</h2>
              </div>
              <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-50">Always on</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {shortcuts.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="group flex items-center justify-between rounded-2xl border border-orange-500/20 bg-black/40 px-4 py-3 text-sm font-semibold text-orange-50 transition hover:border-orange-400/50"
                >
                  <span>{label}</span>
                  <span className="text-orange-200/90 transition group-hover:translate-x-0.5">→</span>
                </a>
              ))}
            </div>

            <p className="mt-3 text-xs text-orange-100/70">Everything you need lives here—no extra clicks or filler text.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-orange-500/15 bg-black/40 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-orange-50">Today&apos;s focus</h2>
            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-50">Crisp view</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-orange-100/85">
            {focusItems.map(({ title, body, accent }) => (
              <li
                key={title}
                className="flex items-start gap-2 rounded-2xl border border-orange-500/10 bg-slate-950/50 px-3 py-2"
              >
                <span className={`mt-0.5 h-2 w-2 rounded-full ${accent}`} />
                <div>
                  <p className="font-semibold text-orange-50">{title}</p>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-orange-500/15 bg-black/40 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)] lg:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Feature deck</p>
              <h2 className="text-xl font-semibold text-orange-50">Built to stay out of your way</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-orange-50">
              <span className="rounded-full border border-orange-500/20 px-3 py-1">Minimal clutter</span>
              <span className="rounded-full border border-orange-500/20 px-3 py-1">Responsive by default</span>
              <span className="rounded-full border border-orange-500/20 px-3 py-1">Secure-by-design</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-orange-500/15 bg-slate-950/60 p-4 text-sm text-orange-100/85 transition hover:border-orange-400/40"
              >
                <p className="text-base font-semibold text-orange-50">{title}</p>
                <p className="mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">KIAAN ecosystem</p>
            <h2 className="text-2xl font-semibold text-orange-50">Every KIAAN flow stays at your fingertips</h2>
            <p className="mt-2 text-sm text-orange-100/80">
              We keep KIAAN and its pathways forward-compatible: shortcuts map directly to the live experiences so nothing gets
              lost in the redesign.
            </p>
          </div>
          <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Protected</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {kiaanHighlights.map(({ title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-orange-500/15 bg-slate-950/60 p-4 text-sm text-orange-100/85 transition hover:border-orange-400/40"
            >
              <p className="text-base font-semibold text-orange-50">{title}</p>
              <p className="mt-2 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]" id="chat">
        <article className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Guided chat</p>
              <h2 className="text-2xl font-semibold text-orange-50">Stay in conversation without leaving home base</h2>
              <p className="mt-2 text-sm text-orange-100/80">Send a message and receive calm, server-backed responses instantly.</p>
            </div>
            <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Secure</span>
          </div>
          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-slate-950/60 p-4">
            <Chat />
          </div>
        </article>

        <article className="rounded-3xl border border-orange-500/15 bg-black/45 p-6 shadow-[0_15px_60px_rgba(255,115,39,0.12)]" id="journal">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Encrypted journal</p>
              <h2 className="text-2xl font-semibold text-orange-50">Capture notes without distraction</h2>
              <p className="mt-2 text-sm text-orange-100/80">Entries stay local with AES-GCM encryption. Crisp, compact, and ready when you are.</p>
            </div>
            <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Local only</span>
          </div>
          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-slate-950/60 p-4">
            <JournalEncrypted />
          </div>
        </article>
      </section>
    </main>
  )
}
