import Link from 'next/link'

const rooms = [
  {
    title: 'Core KIAAN chat',
    detail: 'Open the primary chat surface with steady tone, memory, and safeguards intact.',
    href: '/#kiaan-chat',
    badges: ['Realtime guidance', 'Safety overlays', 'Prefill support']
  },
  {
    title: 'Public rooms',
    detail: 'Switch between room perspectives without losing context or the original prompts.',
    href: '/#wisdom-chat-rooms',
    badges: ['Room anchors', 'Stable prompts', 'One-click return']
  },
  {
    title: 'Relationship compass',
    detail: 'Go directly to the conflict navigation area while keeping the calm, secular tone.',
    href: '/#relationship-compass',
    badges: ['Repair-first', 'Micro-steps', 'Links back to chat']
  }
]

const anchors = [
  {
    label: 'Open main chat',
    href: '/#kiaan-chat',
    description: 'Preserves the live KIAAN thread and message pipeline.'
  },
  {
    label: 'Scroll to rooms',
    href: '/#wisdom-chat-rooms',
    description: 'Jumps to the room table without changing any backend calls.'
  },
  {
    label: 'Review conflict helpers',
    href: '/#relationship-conflict',
    description: 'Leads to the “reply drafts” card while keeping the ecosystem untouched.'
  }
]

export default function RoomsPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Navigation map</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Rooms and chat anchors
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          Each link below opens the exact section of the main experience so no conversation, overlay, or guardrail is altered.
          Use these pages when you want short hops instead of scrolling through the full layout.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {rooms.map(room => (
          <div key={room.title} className="rounded-2xl border border-orange-400/20 bg-black/50 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)]">
            <h3 className="text-lg font-semibold text-orange-50">{room.title}</h3>
            <p className="mt-2 text-sm text-orange-100/80">{room.detail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {room.badges.map(badge => (
                <span key={badge} className="rounded-full border border-orange-400/25 bg-white/5 px-3 py-1 text-[11px] text-orange-100/80">
                  {badge}
                </span>
              ))}
            </div>
            <Link
              href={room.href}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-white/5 px-3 py-2 text-xs font-semibold text-orange-50 transition hover:border-orange-300/80"
            >
              Jump without losing context <span aria-hidden>→</span>
            </Link>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10] via-[#0c0c0f] to-[#0b0909] p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Preserve the ecosystem</p>
            <h3 className="text-2xl font-bold text-orange-50">Use direct anchors instead of altering flows</h3>
            <p className="mt-2 max-w-2xl text-sm text-orange-100/80">
              These shortcuts never rewire chat routing or storage. They simply scroll to the original components so the KIAAN
              guardrails, pause logic, and journaling remain intact.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-white/5 px-4 py-2 text-sm font-semibold text-orange-50 transition hover:border-orange-300/80"
          >
            Return to full page <span aria-hidden>↺</span>
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {anchors.map(anchor => (
            <Link
              key={anchor.href}
              href={anchor.href}
              className="group block rounded-2xl border border-orange-400/20 bg-black/40 p-4 shadow-[0_10px_40px_rgba(255,115,39,0.14)] transition hover:border-orange-300/60"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Anchor</p>
              <h4 className="mt-1 text-lg font-semibold text-orange-50 group-hover:text-orange-200">{anchor.label}</h4>
              <p className="text-sm text-orange-100/80">{anchor.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
