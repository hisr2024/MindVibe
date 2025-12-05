'use client'

import Link from 'next/link'
import type { ToolBadge } from '@/lib/constants/tools'

export interface ToolCardProps {
  /** Icon emoji or text to display */
  icon: string
  /** Title of the tool */
  title: string
  /** Description of the tool (1 line) */
  description: string
  /** Tailwind gradient classes for icon background */
  gradient: string
  /** Link destination */
  href: string
  /** Optional badge indicator */
  badge?: ToolBadge
  /** Whether the tool is disabled */
  disabled?: boolean
  /** Optional className for styling */
  className?: string
}

/**
 * ToolCard component for displaying dashboard tools.
 *
 * Features:
 * - Icon with gradient background (emoji)
 * - Title and description
 * - Optional status badge (New, Premium, Beta)
 * - Hover effects (subtle lift + border glow)
 * - Click-through link to tool's page
 * - MindVibe brand styling (dark theme)
 */
export function ToolCard({
  icon,
  title,
  description,
  gradient,
  href,
  badge,
  disabled = false,
  className = '',
}: ToolCardProps) {
  const badgeStyles: Record<ToolBadge, string> = {
    new: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    premium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    beta: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }

  const cardContent = (
    <>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between gap-2">
        {/* Icon with gradient background */}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-xl transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>
        
        {/* Badge */}
        {badge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeStyles[badge]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Title and description */}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-orange-50 transition-colors duration-200 group-hover:text-white">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-orange-100/70 line-clamp-1">
          {description}
        </p>
      </div>
    </>
  )

  if (disabled) {
    return (
      <div
        className={`group relative cursor-not-allowed rounded-2xl border border-orange-500/10 bg-gradient-to-br from-[#0d0d10] to-[#0c0f14] p-5 opacity-50 ${className}`}
        aria-disabled="true"
      >
        {cardContent}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`group relative block rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#0d0d10] to-[#0c0f14] p-5 shadow-[0_10px_40px_rgba(255,115,39,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-[0_15px_50px_rgba(255,115,39,0.15)] focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-[#0b0b0f] ${className}`}
    >
      {cardContent}
    </Link>
  )
}

export default ToolCard
