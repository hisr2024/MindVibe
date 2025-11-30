const checklist = [
  'Acknowledge the misstep without judgment.',
  'Name the impact you want to repair.',
  'Pick one immediate corrective action.',
  'Plan a follow-up check after the action.',
]

export default function KarmaResetFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 6</p>
        <h2 className="text-2xl font-semibold text-orange-50">Gentle course correction</h2>
        <p className="text-sm text-orange-100/80">Karma Reset Guide keeps the tone warm and non-judgmental.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Checklist</h3>
          <ul className="space-y-2 text-sm text-orange-100/80">
            {checklist.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Tone guardrails</h3>
          <div className="rounded-2xl border border-orange-500/20 bg-black/60 p-3 text-sm text-orange-100/80">
            Keep KIAAN’s warm, non-judgmental tone intact while logging resets.
          </div>
          <div className="grid gap-2 text-sm font-semibold text-slate-900">
            <button className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 shadow-orange-500/20">Start reset</button>
            <button className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">Log follow-up</button>
          </div>
        </div>
      </div>
    </section>
  )
}
