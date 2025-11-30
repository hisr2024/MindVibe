const features = [
  {
    title: 'Wisdom chat rooms',
    description: 'Guided conversations stay intact—each room mirrors the original intent while being discoverable from its own page.',
    highlights: ['KIAAN chat core', 'Public rooms overview', 'Warm, private tone preserved']
  },
  {
    title: 'Clarity pause suite',
    description: 'Grounding timers, reasoning prompts, and closing choices laid out clearly so you can choose without altering the chat logic.',
    highlights: ['Impulsive-signal awareness', 'Breath-led countdowns', 'Calm decision prompts']
  },
  {
    title: 'Journaling',
    description: 'Encrypted, local-first journaling keeps privacy intact while showing how entries and summaries work together.',
    highlights: ['AES-GCM storage reminder', 'Local summaries', 'No account required']
  },
  {
    title: 'Reframing assistants',
    description: 'Ardha and Viyog are presented separately so their voices stay complementary and do not override KIAAN.',
    highlights: ['Gita-aligned reframes', 'Detachment coaching', 'Supportive boundaries']
  },
  {
    title: 'Relationship compass',
    description: 'Conflict guidance is spelled out with clear entry points back to the live chat rooms.',
    highlights: ['Check-ins before replying', 'Repair micro-steps', 'Links back to chat anchors']
  },
  {
    title: 'Daily wisdom & karma reset',
    description: 'Daily prompts and restart guides get their own section while remaining in sync with the existing experience.',
    highlights: ['Fresh prompts', 'Gentle resets', 'No backend changes']
  }
]

export default function FeatureAtlas() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Feature atlas</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          KIAAN capabilities by page
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          Each card below mirrors a KIAAN capability without changing its source behavior. Use these pages to understand what exists and jump back to the core chat with confidence.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map(feature => (
          <div key={feature.title} className="rounded-2xl border border-orange-400/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h3 className="text-xl font-semibold text-orange-50">{feature.title}</h3>
            <p className="mt-2 text-sm text-orange-100/80">{feature.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {feature.highlights.map(item => (
                <span key={item} className="rounded-full border border-orange-400/25 bg-white/5 px-3 py-1 text-xs text-orange-100/80">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
