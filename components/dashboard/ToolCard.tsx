'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { colors } from '@/lib/design-tokens'

export interface ToolCardProps {
  /** Icon to display */
  icon: ReactNode
  /** Title of the tool */
  title: string
  /** Description of the tool */
  description: string
  /** Gradient colors for the icon background */
  gradient?: {
    from: string
    to: string
  }
  /** Link destination */
  href: string
  /** Call-to-action button text */
  ctaText?: string
  /** Optional className for styling */
  className?: string
}

/**
 * ToolCard component for displaying dashboard tools.
 *
 * Features:
 * - Icon with gradient background
 * - Title and description
 * - Call-to-action button
 * - Hover effects
 * - Link to tool page
 */
export function ToolCard({
  icon,
  title,
  description,
  gradient = { from: colors.brand.primary, to: colors.brand.secondary },
  href,
  ctaText = 'Open',
  className = '',
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
    >
      {/* Icon with gradient background */}
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        }}
      >
        <span className="text-white">{icon}</span>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm text-gray-500 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{description}</p>

      {/* CTA */}
      <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
        {ctaText}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  )
}

export default ToolCard
