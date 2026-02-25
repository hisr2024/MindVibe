const pillars = [
  'Detect the cognitive distortion with CBT precision.',
  'Name the emotion and explain the mechanism.',
  'Deliver a grounded Gita-aligned truth, not abstraction.',
  'Provide one concrete disciplined action (abhyasa).',
]

export default function ArdhaFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Page 4</p>
        <h2 className="text-2xl font-semibold text-[#f5f0e8]">Gita-aligned cognitive reframing</h2>
        <p className="text-sm text-[#f5f0e8]/80">Meet Ardha: Cognitive clarity shaped by the Gita.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-[#f5f0e8]">Flow</h3>
          <ol className="space-y-2 text-sm text-[#f5f0e8]/80">
            <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347]" aria-hidden />Detect the cognitive distortion and name the emotion precisely.</li>
            <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347]" aria-hidden />Explain the mechanism, deliver a Gita-aligned truth, and calibrate story vs fact.</li>
            <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347]" aria-hidden />Provide one disciplined action and a sharp reflective question.</li>
          </ol>
          <div className="rounded-2xl border border-[#d4a44c]/25 bg-black/60 p-3 text-xs text-[#f5f0e8]/80">No accounts • Stored locally</div>
        </div>
        <div className="space-y-2 rounded-2xl border border-[#d4a44c]/20 bg-[#050507]/80 p-4">
          <h3 className="text-lg font-semibold text-[#f5f0e8]">Pillars</h3>
          <ul className="space-y-2 text-sm text-[#f5f0e8]/80">
            {pillars.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-[#d4a44c] to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
