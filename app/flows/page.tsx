import Link from 'next/link'

const pages = [
  { href: '/flows/access', title: 'Page 1: Access', detail: 'Login ID, password, and first-time registration kept local.' },
  { href: '/flows/check-in', title: 'Page 2: State check-in', detail: 'Quick mood capture with present-moment context.' },
  { href: '/flows/kiaan', title: 'Page 3: Talk to KIAAN', detail: 'Chat plus clarity pause watch with pass-through controls.' },
  { href: '/flows/ardha', title: 'Page 4: Ardha reframing', detail: 'Gita-aligned reframes with validation and steps.' },
  { href: '/flows/viyog', title: 'Page 5: Viyog outcome reducer', detail: 'Detachment coaching, decision timer, and pause overlay.' },
  { href: '/flows/karma-reset', title: 'Page 6: Karma reset', detail: 'Gentle course correction checklist.' },
  { href: '/flows/wisdom', title: 'Page 7: Today’s wisdom', detail: 'Timestamped insight with chat, save, and share actions.' },
  { href: '/flows/journal', title: 'Page 8: Private journal', detail: 'AES-GCM local storage with weekly refresh.' },
]

const journeyAdditions = [
  { href: '/onboarding', title: 'Onboarding', detail: 'Guided intro, privacy primer, demo data mode, opt-ins, reduced motion.' },
  { href: '/insights', title: 'Insights', detail: 'Weekly digest, offline-first coaching notes, crisis-aware nudges.' },
  { href: '/flows/viyog', title: 'Coaching', detail: 'Outcome reducer with crisis guardrails and accountability prompts.' },
]

export default function FlowsHome() {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Flow index</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Eight focused pages, no feature loss
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/80">
          Each page isolates one functional model—authentication, check-ins, KIAAN chat, reframing, outcome detachment, clarity pauses, wisdom, and encrypted journaling—while keeping existing components intact.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map(page => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-2xl border border-orange-500/20 bg-black/50 p-5 shadow-[0_12px_48px_rgba(255,115,39,0.12)] transition hover:border-orange-300/70"
          >
            <h3 className="text-lg font-semibold text-orange-50">{page.title}</h3>
            <p className="mt-2 text-sm text-orange-100/80">{page.detail}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Core journeys</p>
            <h3 className="text-xl font-semibold text-orange-50">Onboarding, insights, and coaching kept intact</h3>
            <p className="text-sm text-orange-100/80">These routes complete the information architecture the product brief calls for.</p>
          </div>
          <Link
            href="/journeys"
            className="rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-orange-500/25"
          >
            View journey map
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {journeyAdditions.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-orange-500/20 bg-black/40 p-4 text-sm text-orange-100/80 transition hover:border-orange-400/50"
            >
              <p className="text-base font-semibold text-orange-50">{item.title}</p>
              <p className="mt-2 leading-relaxed">{item.detail}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
