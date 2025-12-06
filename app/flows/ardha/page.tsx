const pillars = [
  'Validate the feeling without dilution.',
  'Spot the distortion before offering the shift.',
  'Use ancient-wisdom-aligned calm insight, not sermons.',
  'Close with one doable action inside the user’s control.',
]

export default function ArdhaFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 4</p>
        <h2 className="text-2xl font-semibold text-orange-50">Ancient wisdom-aligned reframing</h2>
        <p className="text-sm text-orange-100/80">Meet Ardha: The Reframing Assistant.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Flow</h3>
          <ol className="space-y-2 text-sm text-orange-100/80">
            <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />Listen for the distortion inside a heavy thought.</li>
            <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />Validate, then reshape using calm, grounded insight.</li>
            <li className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />Deliver a reframe plus one grounded step.</li>
          </ol>
          <div className="rounded-2xl border border-orange-500/25 bg-black/60 p-3 text-xs text-orange-100/80">No accounts • Stored locally</div>
        </div>
        <div className="space-y-2 rounded-2xl border border-orange-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Pillars</h3>
          <ul className="space-y-2 text-sm text-orange-100/80">
            {pillars.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
