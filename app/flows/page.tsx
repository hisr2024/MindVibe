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
      <div className="rounded-2xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 p-4">
        <p className="text-sm text-[#f5f0e8]">
          💡 <strong>Looking for features?</strong> Flows are now part of our unified{' '}
          <Link href="/features" className="text-[#e8b54a] underline hover:text-[#e8b54a]">
            Features page
          </Link>
          .
        </p>
      </div>

      {/* Voice AI Feature - Highlighted */}
      <Link
        href={voiceFeature.href}
        className="block rounded-3xl border-2 border-[#d4a44c]/40 bg-gradient-to-br from-[#d4a44c]/10 via-amber-500/5 to-purple-500/10 p-6 md:p-8 shadow-[0_20px_80px_rgba(212,164,76,0.2)] transition-all hover:border-[#d4a44c]/60 hover:shadow-[0_20px_80px_rgba(212,164,76,0.3)] group"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a44c]/30 to-amber-500/30 text-3xl">
              🎙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#f5f0e8] group-hover:text-[#e8b54a] transition-colors">
                  {voiceFeature.title}
                </h3>
                <span className="rounded-full bg-[#d4a44c]/30 px-2 py-0.5 text-xs font-semibold text-[#e8b54a]">
                  {voiceFeature.badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#f5f0e8]/80">{voiceFeature.detail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#e8b54a] group-hover:text-[#e8b54a] transition-colors">
            <span className="text-sm font-medium">Try Voice Mode</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>

      <div className="rounded-3xl border border-[#d4a44c]/15 bg-[#050507]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Flow index</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#e8b54a] via-[#ffb347] to-[#e8b54a]">
          Seven focused pages, no feature loss
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-[#f5f0e8]/80">
          Each page isolates one functional model—authentication, check-ins, KIAAN chat, reframing, outcome detachment, clarity pauses, wisdom, and encrypted journaling—while keeping existing components intact.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages.map(page => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-2xl border border-[#d4a44c]/20 bg-black/50 p-5 shadow-[0_12px_48px_rgba(212,164,76,0.12)] transition hover:border-[#d4a44c]/70"
          >
            <h3 className="text-lg font-semibold text-[#f5f0e8]">{page.title}</h3>
            <p className="mt-2 text-sm text-[#f5f0e8]/80">{page.detail}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
