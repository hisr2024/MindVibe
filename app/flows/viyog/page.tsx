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
    <section className="space-y-6 rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Page 5</p>
        <h2 className="text-2xl font-semibold text-[#f5f0e8]">Outcome anxiety reducer</h2>
        <p className="text-sm text-[#f5f0e8]/80">Meet Viyoga: The Detachment Coach.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3 rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-[#f5f0e8]">Flow</h3>
          <ol className="space-y-2 text-sm text-[#f5f0e8]/80">
            {steps.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-[#d4a44c]/25 bg-black/60 p-3 text-xs text-[#f5f0e8]/80">No accounts • Stored locally</div>
          <div className="rounded-2xl border border-[#d4a44c]/20 bg-black/60 p-3 text-sm text-[#f5f0e8]/80">Share the outcome worry.</div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#d4a44c]/20 bg-[#050507]/80 p-4">
          <h3 className="text-lg font-semibold text-[#f5f0e8]">High-Stress Decision Timer</h3>
          <ul className="space-y-2 text-sm text-[#f5f0e8]/80">
            {timerGuide.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="grid gap-2 text-sm font-semibold text-slate-900">
            <button className="rounded-2xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-amber-300 px-4 py-2 shadow-[#d4a44c]/20">Clarity pause</button>
            <button className="rounded-2xl border border-[#d4a44c]/25 px-4 py-2 text-[#f5f0e8]">Pass-through mode</button>
          </div>
        </div>
      </div>
    </section>
  )
}
