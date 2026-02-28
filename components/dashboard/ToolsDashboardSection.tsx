'use client'

import Link from 'next/link'
import { TOOLS_BY_CATEGORY } from '@/lib/constants/tools'
import { useLanguage } from '@/hooks/useLanguage'

/**
 * ToolsDashboardSection component displays all MindVibe tools in a categorized grid.
 * 
 * Note: KIAAN navigation changed from modal to direct page navigation (/kiaan).
 * All tools now use standard Link navigation for consistency.
 */
export function ToolsDashboardSection() {
  const { t } = useLanguage()

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-4 sm:p-6 shadow-[0_25px_90px_rgba(255,147,71,0.16)]">
      <div className="mb-4 sm:mb-6 flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8b54a]">{t('dashboard.title', 'Dashboard')}</p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f5f0e8]">{t('dashboard.allTools', 'All tools in one place')}</h2>
          <p className="mt-1 text-sm text-[#f5f0e8]/80">{t('dashboard.subtitle', 'Sakha tools')}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full border border-[#d4a44c]/30 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f5f0e8] shadow-lg shadow-[#d4a44c]/15 transition hover:border-[#d4a44c]/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/60 focus:ring-offset-2 focus:ring-offset-[#050507]"
        >
          {t('dashboard.returnHome', 'Return to home')}
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {TOOLS_BY_CATEGORY.map(category => (
          <div
            key={category.id}
            className="rounded-2xl border border-[#d4a44c]/10 bg-white/5 p-3 sm:p-4 shadow-[0_14px_60px_rgba(212,164,76,0.12)] backdrop-blur"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#f5f0e8]/70">
                  {t(`dashboard.categories.${category.id}`, category.name)}
                </p>
                <p className="text-xs text-[#f5f0e8]/70">
                  {category.tools.length} {t('dashboard.toolsCount', 'tools')}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {category.tools.map(tool => (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/30 px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:border-[#d4a44c]/40 hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/60 focus:ring-offset-2 focus:ring-offset-[#050507]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tool.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-[#f5f0e8] group-hover:text-white">
                        {t(`dashboard.tools.${tool.id}.title`, tool.title)}
                      </p>
                      <p className="text-[11px] text-[#f5f0e8]/70">
                        {t(`dashboard.tools.${tool.id}.description`, tool.description)}
                      </p>
                      {tool.purposeDescKey && (
                        <p className="text-[10px] text-[#e8b54a]/50 truncate">
                          {t(`dashboard.tool_desc.${tool.purposeDescKey}`, '')}
                        </p>
                      )}
                    </div>
                  </div>
                  {tool.badge && (
                    <span className="rounded-full border border-[#d4a44c]/40 bg-[#d4a44c]/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#f5f0e8]">
                      {t(`dashboard.badges.${tool.badge}`, tool.badge)}
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
