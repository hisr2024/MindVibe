export default function WisdomFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Page 7</p>
        <h2 className="text-2xl font-semibold">Today's Wisdom</h2>
        <p className="text-body text-[var(--mv-text-secondary)]">Timestamped insight with actions.</p>
      </header>

      <div className="space-y-4 rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#f5f0e8]/80">
          <span>30.11.2025</span>
          <span className="rounded-2xl border border-[#d4a44c]/25 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">Action without Attachment</span>
        </div>
        <p className="text-lg font-semibold">
          "The key to peace lies not in controlling outcomes, but in mastering your response. Focus your energy on doing your best without attachment to results, and discover true freedom."
        </p>
        <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-900">
          <button className="rounded-2xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-amber-300 px-4 py-2 shadow-[#d4a44c]/20">💬 Chat about this</button>
          <button className="rounded-2xl border border-[#d4a44c]/25 px-4 py-2 text-[#f5f0e8]">☆ Save</button>
          <button className="rounded-2xl border border-[#d4a44c]/25 px-4 py-2 text-[#f5f0e8]">📤 Share</button>
        </div>
        <div className="rounded-2xl border border-[#d4a44c]/20 bg-black/60 p-3 text-body text-[var(--mv-text-secondary)]">
          Community Rooms
        </div>
        <div className="rounded-2xl border border-[#d4a44c]/20 bg-black/60 p-3 text-body text-[var(--mv-text-secondary)]">
          Wisdom Chat Rooms
        </div>
      </div>
    </section>
  )
}
