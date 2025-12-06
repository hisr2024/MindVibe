const steps = [
  'Name the outcome worry in one line.',
  'Detach from result; pick one present action.',
  'Run the 60-second clarity pause if urgency is high.',
]

const timerGuide = [
  'Detect a trigger',
  'Launch pause prompt',
  'Watch the 60-second guide animate in real time',
]

export default function ViyogFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 5</p>
        <h2 className="text-2xl font-semibold text-orange-50">Outcome anxiety reducer</h2>
        <p className="text-sm text-orange-100/80">Meet Viyoga: The Detachment Coach.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Flow</h3>
          <ol className="space-y-2 text-sm text-orange-100/80">
            {steps.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-orange-500/25 bg-black/60 p-3 text-xs text-orange-100/80">No accounts • Stored locally</div>
          <div className="rounded-2xl border border-orange-500/20 bg-black/60 p-3 text-sm text-orange-100/80">Share the outcome worry.</div>
        </div>

        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">High-Stress Decision Timer</h3>
          <ul className="space-y-2 text-sm text-orange-100/80">
            {timerGuide.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 text-sm font-semibold text-slate-900">
            <button className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 shadow-orange-500/20">Clarity pause</button>
            <button className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">Pass-through mode</button>
          </div>
        </div>
      </div>
    </section>
  )
}
