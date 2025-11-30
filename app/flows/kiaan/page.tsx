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
    <section className="space-y-6 rounded-3xl border border-orange-500/15 bg-black/50 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Page 3</p>
        <h2 className="text-2xl font-semibold text-orange-50">Talk to KIAAN</h2>
        <p className="text-sm text-orange-100/80">Pass-through chat with clarity pause watch stays intact.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0d0d10]/80 p-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-orange-50">Clarity pause watch</h3>
          <p className="text-sm text-orange-100/80">KIAAN quietly scores urgency and emotion.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {clarityBands.map(band => (
              <div key={band.label} className="rounded-2xl border border-orange-500/25 bg-black/60 p-3">
                <div className="text-sm font-semibold text-orange-50">{band.label}</div>
                <div className="text-sm text-orange-100/80">{band.action}</div>
                <div className="text-xs text-orange-100/70">{band.note}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-900 font-semibold">
            <button className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 shadow-orange-500/20">Open clarity pause now</button>
            <button className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">Reset watch</button>
          </div>
          <p className="text-xs text-orange-100/70">KIAAN never blocks your message—decline the overlay anytime.</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-orange-500/20 bg-[#0b0b0f]/80 p-4">
          <h3 className="text-lg font-semibold text-orange-50">🎯 Quick responses</h3>
          <ul className="space-y-2 text-sm text-orange-100/80">
            {quickResponses.map(item => (
              <li key={item.title} className="rounded-2xl border border-orange-500/20 bg-black/60 p-3">
                <div className="font-semibold text-orange-50">{item.title}</div>
                <div>{item.body}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
