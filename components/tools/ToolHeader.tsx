'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'

export interface ToolHeaderProps {
  /** Icon emoji or element for the tool */
  icon: ReactNode
  /** Main title of the tool */
  title: string
  /** Subtitle or brief description */
  subtitle: string
  /** Optional CTA button configuration */
  cta?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Optional back link configuration */
  backLink?: {
    label: string
    href: string
  }
  /** Additional className for styling */
  className?: string
}

/**
 * ToolHeader component for consistent tool page headers.
 * 
 * Features:
 * - Left-aligned heading with icon
 * - Subtitle text
 * - Optional CTA button
 * - Optional back link
 * - Accessible and keyboard-navigable
 */
export function ToolHeader({
  icon,
  title,
  subtitle,
  cta,
  backLink,
  className = '',
}: ToolHeaderProps) {
  return (
    <header
      className={`rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)] ${className}`}
      role="banner"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-xl"
              aria-hidden="true"
            >
              {icon}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <p className="text-sm text-orange-100/80 max-w-xl ml-[52px]">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {cta && (
            cta.href ? (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {cta.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={cta.onClick}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 font-semibold shadow-lg shadow-orange-500/25 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                {cta.label}
              </button>
            )
          )}
          {backLink && (
            <Link
              href={backLink.href}
              className="text-xs text-orange-100/70 hover:text-orange-200 transition focus:outline-none focus:ring-2 focus:ring-orange-400/50 rounded px-1"
            >
              ← {backLink.label}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default ToolHeader
