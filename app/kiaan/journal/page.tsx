import Link from 'next/link'

const steps = [
  {
    title: 'Local-only storage',
    detail: 'Entries stay in localStorage with AES-GCM encryption; nothing posts to the backend.',
    anchor: '/#journal-section',
    chips: ['AES-GCM', 'Local summaries', 'Device privacy']
  },
  {
    title: 'Secure summaries',
    detail: 'Summaries reuse the same on-page helper so context and tone mirror the live journal.',
    anchor: '/#journal-section',
    chips: ['Same helper text', 'No new prompts', 'Offline friendly']
  },
  {
    title: 'Chat handoff',
    detail: 'Send select reflections back to the chat via the existing “send to KIAAN” controls.',
    anchor: '/#journal-section',
    chips: ['Respectful handoff', 'No new API calls', 'Opt-in only']
  }
]

const guardrails = [
  'Data never leaves the browser—deep links only scroll to the established journal component.',
  'All encryption keys reuse the same localStorage key path; no duplicates or resets are added.',
  'Calls to KIAAN stay routed through the main chat component, preserving tone and safeguards.'
]

export default function JournalPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Journal & privacy</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Shortcuts to the encrypted journal
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          Move through the journaling experience page by page while keeping every safeguard intact. Use these anchors to land on
          the live journal component instead of recreating it elsewhere.
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
              Go to journal <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10] via-[#0c0c0f] to-[#0b0909] p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Privacy locked</p>
            <h3 className="text-2xl font-bold text-orange-50">No new storage paths</h3>
            <p className="mt-2 max-w-2xl text-sm text-orange-100/80">
              The journal keeps its local-first design. These multi-page links highlight the feature while pointing back to the
              single implementation that already encrypts entries on-device.
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
          {guardrails.map(item => (
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
