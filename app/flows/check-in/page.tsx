const states = ['Grounded', 'Tense', 'Worried', 'Drained', 'Energized']
const prompts = ['What triggered this?', 'Where do you feel it?', 'What helps right now?']

export default function StateCheckIn() {
  return (
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 2</p>
        <h2 className="text-2xl font-semibold text-orange-50">State check-in</h2>
        <p className="text-sm text-orange-100/80">Capture how you are feeling and keep context tight for follow-up flows.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Mood picker</h3>
          <div className="flex flex-wrap gap-2">
            {states.map(state => (
              <button
                key={state}
                className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-sm font-semibold text-orange-50 transition hover:bg-orange-500/20"
              >
                {state}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Write a quick note about the moment."
            className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/70 p-3 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/70"
            rows={4}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Context prompts</h3>
          <ul className="space-y-2 text-sm text-orange-100/80">
            {prompts.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-orange-500/25 bg-black/60 p-3 text-sm text-orange-100/80">
            Snapshot is saved locally for the next page.
          </div>
        </div>
      </div>
    </section>
  )
}
