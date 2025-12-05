'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { MindVibeLockup } from '@/components/branding'

export interface ToolHeaderProps {
  /** Main title of the tool (e.g., "Viyog - Detachment Coach") */
  title: string
  /** Subtitle or tagline */
  subtitle?: string
  /** Short description of the tool */
  description?: string
  /** Badge content */
  badge?: string
  /** Back link URL */
  backHref?: string
  /** Back link text */
  backText?: string
  /** Show MindVibe logo */
  showLogo?: boolean
  /** Additional actions/badges */
  actions?: ReactNode
  /** Additional className */
  className?: string
}

/**
 * ToolHeader component for consistent tool page headers.
 *
 * Features:
 * - Gradient title styling
 * - Subtitle and description
 * - Back navigation link
 * - Optional MindVibe logo
 * - Accessibility attributes
 * - Responsive design
 */
export function ToolHeader({
  title,
  subtitle,
  description,
  badge,
  backHref = '/',
  backText = '← Back to home',
  showLogo = false,
  actions,
  className = '',
}: ToolHeaderProps) {
  return (
    <header
      className={`rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)] ${className}`}
      role="banner"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          {showLogo && (
            <MindVibeLockup
              theme="sunrise"
              className="h-8 w-auto mb-3 drop-shadow-[0_10px_40px_rgba(255,147,89,0.28)]"
            />
          )}
          {subtitle && (
            <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">
              {subtitle}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-orange-100 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-orange-100/80 max-w-xl">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {badge && (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold text-orange-50"
              role="status"
            >
              {badge}
            </span>
          )}
          {actions}
          <Link
            href={backHref}
            className="text-xs text-orange-100/70 hover:text-orange-200 transition focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
          >
            {backText}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default ToolHeader
