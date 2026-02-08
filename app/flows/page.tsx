import Link from 'next/link'

const pages = [
  { href: '/flows/access', title: 'Page 1: Access', detail: 'Login ID, password, and first-time registration kept local.' },
  { href: '/flows/check-in', title: 'Page 2: State check-in', detail: 'Quick mood capture with present-moment context.' },
  { href: '/flows/kiaan', title: 'Page 3: Talk to KIAAN', detail: 'Chat plus clarity pause watch with pass-through controls.' },
  { href: '/flows/ardha', title: 'Page 4: Ardha reframing', detail: 'Ancient wisdom-aligned reframes with validation and steps.' },
  { href: '/flows/viyog', title: 'Page 5: Viyoga outcome reducer', detail: 'Detachment coaching, decision timer, and pause overlay.' },
  { href: '/flows/wisdom', title: "Page 6: Today's wisdom", detail: 'Timestamped insight with chat, save, and share actions.' },
  { href: '/flows/journal', title: 'Page 7: Private journal', detail: 'AES-GCM local storage with weekly refresh.' },
]

const voiceFeature = {
  href: '/companion',
  title: 'KIAAN Companion',
  detail: 'Your divine best friend with voice guidance, Gita wisdom, and access to every wellness tool.',
  badge: 'New'
}

export default function FlowsHome() {
  return (
    <section className="space-y-8">
      {/* Redirect notice */}
      <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4">
        <p className="text-sm text-orange-100">
          💡 <strong>Looking for features?</strong> Flows are now part of our unified{' '}
          <Link href="/features" className="text-orange-300 underline hover:text-orange-200">
            Features page
          </Link>
          .
        </p>
      </div>

      {/* Voice AI Feature - Highlighted */}
      <Link
        href={voiceFeature.href}
        className="block rounded-3xl border-2 border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-purple-500/10 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.2)] transition-all hover:border-orange-400/60 hover:shadow-[0_20px_80px_rgba(255,115,39,0.3)] group"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/30 to-amber-500/30 text-3xl">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-orange-50 group-hover:text-orange-200 transition-colors">
                  {voiceFeature.title}
                </h3>
                <span className="rounded-full bg-orange-500/30 px-2 py-0.5 text-xs font-semibold text-orange-200">
                  {voiceFeature.badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-orange-100/80">{voiceFeature.detail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-orange-300 group-hover:text-orange-200 transition-colors">
            <span className="text-sm font-medium">Try Voice Mode</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>

      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Flow index</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Seven focused pages, no feature loss
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
    </section>
  )
}
