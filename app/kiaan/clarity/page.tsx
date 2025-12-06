import Link from 'next/link'

const steps = [
  {
    title: 'Auto-detected overlays',
    detail: 'Urgency and emotion signals trigger the pause overlay while keeping messages queued.',
    anchor: '/#kiaan-chat',
    chips: ['Impulse scoring', 'Safety-first UX', 'Non-blocking']
  },
  {
    title: 'Manual pause starter',
    detail: 'Manually start the 60-second clarity timer with the exact prompts from the main flow.',
    anchor: '/#kiaan-chat',
    chips: ['Breath pacing', 'Grounding steps', 'Same countdown copy']
  },
  {
    title: 'Reasoning prompts',
    detail: 'Surface the reasoning and closing choices without changing how KIAAN evaluates risk.',
    anchor: '/#kiaan-chat',
    chips: ['Reversible', 'No new state', 'Ancient wisdom-aligned language']
  }
]

const reminders = [
  'All links scroll to the original clarity components so the overlay logic never forks.',
  'Messages still route through the core KIAAN chat—no alternate API paths are introduced.',
  'Breathing, grounding, and follow-up prompts use the same text shown on the primary page.'
]

export default function ClarityPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Clarity pause suite</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Breath-led pacing without losing the original flow
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          This page breaks the clarity suite into quick entry points. Each CTA scrolls back to the single source of truth on the
          main KIAAN layout so overlays, timers, and confidence scores stay untouched.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(step => (
          <div key={step.title} className="rounded-2xl border border-orange-400/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h3 className="text-lg font-semibold text-orange-50">{step.title}</h3>
            <p className="mt-2 text-sm text-orange-100/80">{step.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {step.chips.map(chip => (
                <span key={chip} className="rounded-full border border-orange-400/25 bg-white/5 px-3 py-1 text-[11px] text-orange-100/80">
                  {chip}
                </span>
              ))}
            </div>
            <Link
              href={step.anchor}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-white/5 px-3 py-2 text-xs font-semibold text-orange-50 transition hover:border-orange-300/80"
            >
              Open pause controls <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10] via-[#0c0c0f] to-[#0b0909] p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Guardrails preserved</p>
            <h3 className="text-2xl font-bold text-orange-50">Same overlay, same timers</h3>
            <p className="mt-2 max-w-2xl text-sm text-orange-100/80">
              The clarity suite depends on the shared state inside the main page. These deep links simply position you at the
              correct component so the countdown, motion-reduction flag, and follow-ups behave identically.
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
          {reminders.map(item => (
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
