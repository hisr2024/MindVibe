import Link from 'next/link'

const journeys = [
  {
    title: 'From overwhelm to calm action',
    steps: ['Start with the clarity pause suite', 'Move into grounding prompts', 'Return to KIAAN chat for next actions'],
    anchor: '#clarity-suite'
  },
  {
    title: 'Relationship reset',
    steps: ['Check-in with the relationship compass', 'Draft a response in a public room', 'Log reflections in the encrypted journal'],
    anchor: '#relationship-compass'
  },
  {
    title: 'Daily balance',
    steps: ['Pick a daily wisdom prompt', 'Run a quick chat with a selected room', 'Capture the takeaway in your profile notes'],
    anchor: '#kiaan-chat'
  }
]

const safetyNotes = [
  'Links route back to the existing one-page experience—no duplicated chat logic.',
  'Experiences are descriptive; all live interactions remain where they were built.',
  'Anchors respect current section IDs so the original layout remains unharmed.'
]

export default function ExperienceFlows() {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f]/80 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Experience flows</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Guided routes without disruptions
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          These flows stitch together existing KIAAN sections into clear, multi-page journeys. Each link returns to the main chat surface so the ecosystem stays unified.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {journeys.map(journey => (
          <div key={journey.title} className="rounded-2xl border border-orange-400/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h3 className="text-lg font-semibold text-orange-50">{journey.title}</h3>
            <ol className="mt-3 space-y-2 text-sm text-orange-100/80">
              {journey.steps.map(step => (
                <li key={step} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href={`/${journey.anchor}`}
              className="mt-4 inline-flex rounded-xl border border-orange-400/30 bg-white/5 px-3 py-2 text-xs font-semibold text-orange-50 transition hover:border-orange-300/70"
            >
              Jump to this flow in KIAAN
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
        <h3 className="text-lg font-semibold text-orange-50">No ecosystem changes</h3>
        <p className="mt-2 max-w-3xl text-sm text-orange-100/80">
          Each experience is additive. It references the original KIAAN layout by anchor, keeps storage untouched, and avoids duplicating chat behaviors.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {safetyNotes.map(note => (
            <div key={note} className="rounded-2xl border border-orange-400/20 bg-black/50 p-4 text-sm text-orange-100/80">
              {note}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
