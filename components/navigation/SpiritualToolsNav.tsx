'use client'

/**
 * SpiritualToolsNav – Cross-feature navigation for MindVibe's spiritual toolkit.
 *
 * Renders a compact grid of links connecting the core spiritual tools:
 * Ardha, Viyoga, Relationship Compass, Emotional Reset, Karma Reset,
 * and KIAAN Chat.
 *
 * Highlights the active tool and dims it so the user sees related tools.
 * Works fully offline — no network dependency.
 */

import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'

export type SpiritualToolId =
  | 'ardha'
  | 'viyoga'
  | 'relationship-compass'
  | 'emotional-reset'
  | 'karma-reset'
  | 'karma-footprint'
  | 'kiaan'

interface ToolLink {
  id: SpiritualToolId
  icon: string
  label: string
  href: string
  description: string
}

const SPIRITUAL_TOOLS: ToolLink[] = [
  {
    id: 'viyoga',
    icon: '🎯',
    label: 'Viyoga',
    href: '/tools/viyog',
    description: 'Release attachment to outcomes',
  },
  {
    id: 'ardha',
    icon: '🔄',
    label: 'Ardha',
    href: '/tools/ardha',
    description: 'Reframe distorted thoughts',
  },
  {
    id: 'kiaan',
    icon: '💬',
    label: 'KIAAN Chat',
    href: '/kiaan/chat',
    description: 'Converse with your spiritual companion',
  },
  {
    id: 'relationship-compass',
    icon: '🧭',
    label: 'Relationship Compass',
    href: '/tools/relationship-compass',
    description: 'Gita-grounded relationship guidance',
  },
  {
    id: 'emotional-reset',
    icon: '💫',
    label: 'Emotional Reset',
    href: '/tools/emotional-reset',
    description: '7-step guided emotional processing',
  },
  {
    id: 'karma-reset',
    icon: '💚',
    label: 'Karma Reset',
    href: '/tools/karma-reset',
    description: 'Heal relational harm with compassion',
  },
]

export interface SpiritualToolsNavProps {
  /** The currently active tool — will be shown but dimmed */
  currentTool?: SpiritualToolId
  /** Optional className for the container */
  className?: string
  /** Compact mode: single-column list instead of grid */
  compact?: boolean
}

export function SpiritualToolsNav({
  currentTool,
  className = '',
  compact = false,
}: SpiritualToolsNavProps) {
  const { t } = useLanguage()

  const visibleTools = SPIRITUAL_TOOLS.filter((tool) => tool.id !== currentTool)

  return (
    <div
      className={`rounded-2xl border border-orange-500/20 bg-[#0b0c0f]/90 p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] ${className}`}
    >
      <h3 className="text-sm font-semibold text-orange-50 mb-1">
        {t('navigation.spiritual_tools.title', 'Spiritual Toolkit')}
      </h3>
      <p className="text-[10px] text-orange-100/70 mb-4">
        {t(
          'navigation.spiritual_tools.subtitle',
          'Navigate your path — each tool connects to the next'
        )}
      </p>

      <div className={compact ? 'space-y-2' : 'grid grid-cols-1 gap-2'}>
        {visibleTools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group flex items-center gap-3 rounded-xl border border-orange-500/15 bg-black/30 px-3 py-2.5 transition-all hover:border-orange-400/40 hover:bg-orange-500/5"
          >
            <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
              {tool.icon}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-orange-50 group-hover:text-orange-200 transition-colors">
                {tool.label}
              </span>
              <p className="text-[10px] text-orange-100/70 leading-tight mt-0.5 truncate">
                {tool.description}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-orange-400/30 group-hover:text-orange-400/70 group-hover:translate-x-0.5 transition-all flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default SpiritualToolsNav
