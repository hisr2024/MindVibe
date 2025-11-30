const notes = [
  'Entries stay on your device and refresh the weekly guidance automatically.',
  'Weekly entries: 0',
  'AES-GCM secured locally',
  'Offline-ready: saves on device',
]

export default function JournalFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 8</p>
        <h2 className="text-2xl font-semibold text-orange-50">Private Journal</h2>
        <p className="text-sm text-orange-100/80">Sacred Reflections with sealed local storage.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Notes</h3>
          <ul className="space-y-2 text-sm text-orange-100/80">
            {notes.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-orange-500/25 bg-black/60 p-3 text-sm text-orange-100/80">🔒 Fully encrypted on your device.</div>
        </div>

        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">Entry form</h3>
          <input
            placeholder="Title"
            className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/70 px-3 py-2 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/70"
          />
          <textarea
            placeholder="Write privately. Data is encrypted on your device."
            rows={5}
            className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/70 p-3 text-sm text-orange-50 outline-none focus:ring-2 focus:ring-orange-400/70"
          />
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-slate-900">
            <button className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 shadow-orange-500/20">Save entry</button>
            <button className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">Export</button>
          </div>
        </div>
      </div>
    </section>
  )
}
