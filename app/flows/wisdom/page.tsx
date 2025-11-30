export default function WisdomFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 7</p>
        <h2 className="text-2xl font-semibold text-orange-50">Today’s Wisdom</h2>
        <p className="text-sm text-orange-100/80">Timestamped insight with actions.</p>
      </header>

      <div className="space-y-4 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-orange-100/80">
          <span>30.11.2025</span>
          <span className="rounded-2xl border border-orange-500/25 px-3 py-1 text-xs font-semibold text-orange-50">Action without Attachment</span>
        </div>
        <p className="text-lg font-semibold text-orange-50">
          “The key to peace lies not in controlling outcomes, but in mastering your response. Focus your energy on doing your best without attachment to results, and discover true freedom.”
        </p>
        <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-900">
          <button className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 shadow-orange-500/20">💬 Chat about this</button>
          <button className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">☆ Save</button>
          <button className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">📤 Share</button>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-black/60 p-3 text-sm text-orange-100/80">
          Community Rooms
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-black/60 p-3 text-sm text-orange-100/80">
          Wisdom Chat Rooms
        </div>
      </div>
    </section>
  )
}
