import Link from 'next/link'

const showcasePages = [
  {
    href: '/kiaan/features',
    title: 'Feature atlas',
    summary: 'Each suite detailed on its own page to keep guidance organized.',
    bullets: ['Wisdom chat rooms', 'Grounding tools', 'Journaling safeguards']
  },
  {
    href: '/kiaan/experiences',
    title: 'Experience flows',
    summary: 'Sequential routes that describe how to engage KIAAN without altering the ecosystem.',
    bullets: ['From pause to action', 'Relationship repair paths', 'Balance for busy days']
  },
  {
    href: '/kiaan/profile',
    title: 'Personal profile',
    summary: 'Create a local, private record of your focus areas for a tailored feel.',
    bullets: ['Name + focus areas', 'Room preferences', 'Session notes stored locally']
  }
]

const integrityHighlights = [
  'No backend mutations—everything is client-side and self-contained.',
  'Navigation cards keep the core KIAAN chat untouched and easily reachable.',
  'Pages mirror existing capabilities instead of replacing them.'
]

export default function KiaanHome() {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f]/80 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Site overview</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Multi-page KIAAN experience
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          This dedicated site organizes KIAAN into focused, linked pages so you can explore rooms, routines, and personalization without disturbing the primary chat environment.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {showcasePages.map(page => (
            <Link
              key={page.href}
              href={page.href}
              className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 shadow-[0_10px_40px_rgba(255,115,39,0.14)] transition hover:border-orange-300/60 hover:shadow-orange-500/20"
            >
              <h3 className="text-lg font-semibold text-orange-50">{page.title}</h3>
              <p className="mt-1 text-sm text-orange-100/80">{page.summary}</p>
              <ul className="mt-3 space-y-1 text-sm text-orange-100/80">
                {page.bullets.map(point => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
        <h3 className="text-lg font-semibold text-orange-50">Ecosystem integrity</h3>
        <p className="mt-2 max-w-3xl text-sm text-orange-100/80">
          Every page keeps the KIAAN chat and journal ecosystems intact. Navigation always points back to the primary experience, and all profile data stays on your device.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {integrityHighlights.map(item => (
            <div key={item} className="rounded-2xl border border-orange-400/20 bg-black/50 p-4 text-sm text-orange-100/80">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
