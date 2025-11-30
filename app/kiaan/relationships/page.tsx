import Link from 'next/link'

const sections = [
  {
    title: 'Conflict reply helper',
    detail: 'Navigate tense conversations with the existing reply drafts and calm tone intact.',
    anchor: '/#relationship-conflict',
    chips: ['Secular tone', 'Micro-repairs', 'Keeps chat open']
  },
  {
    title: 'Relationship compass',
    detail: 'Jump to the compass overview without altering the restorative steps or timers.',
    anchor: '/#relationship-compass',
    chips: ['Respect-first', 'No UX changes', 'Room-friendly']
  },
  {
    title: 'Reframing assistants',
    detail: 'Access Ardha and Viyog guidance through the original cards that feed the chat.',
    anchor: '/#ardha-input',
    chips: ['Gita-aligned', 'Prefills preserved', 'No new prompts']
  }
]

const safeguards = [
  'Deep links only scroll to the defined sections; the chat and overlay states remain controlled in one place.',
  'Prefill buttons keep sending through the existing KIAAN chat component—no duplicate message handlers are added.',
  'Language and tone stay untouched to respect the ecosystem’s warm, non-judgmental voice.'
]

export default function RelationshipsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Relationship compass</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Multi-page paths with zero behavior changes
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          Step into the relationship guidance areas from a dedicated page. Each link returns you to the single implementation so
          tone, prompts, and safety cues stay in sync with the rest of KIAAN.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map(section => (
          <div key={section.title} className="rounded-2xl border border-orange-400/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h3 className="text-lg font-semibold text-orange-50">{section.title}</h3>
            <p className="mt-2 text-sm text-orange-100/80">{section.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {section.chips.map(chip => (
                <span key={chip} className="rounded-full border border-orange-400/25 bg-white/5 px-3 py-1 text-[11px] text-orange-100/80">
                  {chip}
                </span>
              ))}
            </div>
            <Link
              href={section.anchor}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-white/5 px-3 py-2 text-xs font-semibold text-orange-50 transition hover:border-orange-300/80"
            >
              Go to this helper <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10] via-[#0c0c0f] to-[#0b0909] p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Respectful tone</p>
            <h3 className="text-2xl font-bold text-orange-50">Guidance stays stable</h3>
            <p className="mt-2 max-w-2xl text-sm text-orange-100/80">
              These routes avoid duplicating chat logic or overlays. They exist to keep navigation tidy while ensuring KIAAN and
              its supporting voices remain unchanged.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-white/5 px-4 py-2 text-sm font-semibold text-orange-50 transition hover:border-orange-300/80"
          >
            Return to full page <span aria-hidden>↺</span>
          </Link>
        </div>

        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {safeguards.map(item => (
            <li
              key={item}
              className="rounded-2xl border border-orange-400/20 bg-black/40 p-4 text-sm text-orange-100/80 shadow-[0_10px_40px_rgba(255,115,39,0.14)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
