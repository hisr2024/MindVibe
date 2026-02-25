const quickResponses = [
  { title: 'Anxiety to calm', body: 'Guide me through a grounding exercise to steady anxious thoughts.' },
  { title: 'Heart feels heavy', body: 'I need gentle words to lift my mood and remind me of my strengths.' },
  { title: 'Cooling anger', body: 'Help me cool down my anger and respond with more patience.' },
  { title: 'Clarity check', body: 'Can you help me see the pros and cons before I decide on something important?' },
  { title: 'Work balance', body: 'Work feels overwhelming—walk me through a quick reset to regain focus.' },
  { title: 'Tender relationships', body: 'How can I handle a tough conversation with care and honesty?' },
  { title: 'Purpose pulse', body: 'I want a short reflection to reconnect with my purpose and direction.' },
  { title: 'Quiet peace', body: 'Lead me in a brief mindful moment so I can feel peaceful again.' },
]

const clarityBands = [
  { label: 'High', action: 'Instant pause overlay', note: 'Auto-launch clarity pause with timer.' },
  { label: 'Medium', action: 'Offer to pause', note: 'Present pause invitation before sending.' },
  { label: 'Low', action: 'Logged only', note: 'No block; signals stay recorded.' },
]

export default function KiaanFlow() {
  return (
    <section className="space-y-6 rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(212,164,76,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Page 3</p>
        <h2 className="text-2xl font-semibold text-[#f5f0e8]">Talk to KIAAN</h2>
        <p className="text-sm text-[#f5f0e8]/80">Pass-through chat with clarity pause watch stays intact.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-[#d4a44c]/20 bg-[#0d0d10]/80 p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#f5f0e8]">Clarity pause watch</h3>
          <p className="text-sm text-[#f5f0e8]/80">KIAAN quietly scores urgency and emotion.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {clarityBands.map(band => (
              <div key={band.label} className="rounded-2xl border border-[#d4a44c]/25 bg-black/60 p-3">
                <div className="text-sm font-semibold text-[#f5f0e8]">{band.label}</div>
                <div className="text-sm text-[#f5f0e8]/80">{band.action}</div>
                <div className="text-xs text-[#f5f0e8]/70">{band.note}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-900 font-semibold">
            <button className="rounded-2xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-amber-300 px-4 py-2 shadow-[#d4a44c]/20">Open clarity pause now</button>
            <button className="rounded-2xl border border-[#d4a44c]/25 px-4 py-2 text-[#f5f0e8]">Reset watch</button>
          </div>
          <p className="text-xs text-[#f5f0e8]/70">KIAAN never blocks your message—decline the overlay anytime.</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#d4a44c]/20 bg-[#050507]/80 p-4">
          <h3 className="text-lg font-semibold text-[#f5f0e8]">🎯 Quick responses</h3>
          <ul className="space-y-2 text-sm text-[#f5f0e8]/80">
            {quickResponses.map(item => (
              <li key={item.title} className="rounded-2xl border border-[#d4a44c]/20 bg-black/60 p-3">
                <div className="font-semibold text-[#f5f0e8]">{item.title}</div>
                <div>{item.body}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
