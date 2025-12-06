import Link from 'next/link'
import { TOOLS_BY_CATEGORY } from '@/lib/constants/tools'

export function ToolsDashboardSection() {
  return (
    <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-6 shadow-[0_25px_90px_rgba(255,147,71,0.16)]">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">Dashboard</p>
          <h2 className="text-2xl font-bold text-orange-50">All tools in one place</h2>
          <p className="mt-1 text-sm text-orange-100/80">MindVibe tools</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-white/10 px-4 py-2 text-xs font-semibold text-orange-50 shadow-lg shadow-orange-500/15 transition hover:border-orange-300/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
        >
          Open full view
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {TOOLS_BY_CATEGORY.map(category => (
          <div
            key={category.id}
            className="rounded-2xl border border-orange-400/10 bg-white/5 p-4 shadow-[0_14px_60px_rgba(255,115,39,0.12)] backdrop-blur"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-orange-100/70">{category.name}</p>
                <p className="text-xs text-orange-100/70">{category.tools.length} tools</p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {category.tools.map(tool => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/30 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:border-orange-400/40 hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tool.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-orange-50 group-hover:text-white">{tool.title}</p>
                      <p className="text-[11px] text-orange-100/70">{tool.description}</p>
                    </div>
                  </div>
                  {tool.badge && (
                    <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-orange-100">
                      {tool.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ToolsDashboardSection
