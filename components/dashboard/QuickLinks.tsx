'use client'

import Link from 'next/link'
import type { ToolConfig } from '@/lib/constants/tools'

export interface QuickLinksProps {
  /** Tools to display as quick links */
  tools: ToolConfig[]
  /** Optional className for styling */
  className?: string
}

/**
 * QuickLinks component for displaying quick access links.
 *
 * Features:
 * - Horizontal scrollable row on mobile
 * - Flex wrap on larger screens
 * - Compact styling for quick actions
 */
export function QuickLinks({ tools, className = '' }: QuickLinksProps) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
    >
      {tools.map((tool) => (
        <Link
          key={tool.id}
          href={tool.href}
          className="group flex items-center gap-2 rounded-xl border border-orange-500/20 bg-black/40 px-3 py-2 text-sm font-medium text-orange-100/80 transition-all duration-200 hover:border-orange-400/50 hover:bg-black/60 hover:text-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-[#0b0b0f]"
        >
          <span className="text-base">{tool.icon}</span>
          <span>{tool.title}</span>
          {tool.badge && (
            <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-300">
              {tool.badge}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

export default QuickLinks
