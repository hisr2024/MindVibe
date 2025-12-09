'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'

export type ToolActionCardVariant = 'orange' | 'purple' | 'green' | 'blue' | 'rose'

export interface ToolActionCardProps {
  /** Icon emoji or element */
  icon?: ReactNode
  /** Card title */
  title: string
  /** Short description line */
  description?: string
  /** CTA button label */
  ctaLabel?: string
  /** Link destination or onClick handler */
  href?: string
  onClick?: () => void
  /** Gradient background classes */
  gradient?: string
  /** Preset gradient and CTA styles */
  variant?: ToolActionCardVariant
  /** Disable all interactivity */
  disabled?: boolean
  /** Optional nested content */
  children?: ReactNode
  /** Additional className */
  className?: string
}

/**
 * ToolActionCard component for tool quick actions.
 * 
 * Features:
 * - Icon display
 * - Title and short description
 * - Primary CTA button
 * - Customizable gradient
 * - Accessible and keyboard-focusable
 */
export function ToolActionCard({
  icon,
  title,
  description,
  ctaLabel,
  href,
  onClick,
  gradient,
  variant = 'orange',
  disabled = false,
  children,
  className = '',
}: ToolActionCardProps) {
  const variantGradients: Record<ToolActionCardVariant, string> = {
    orange: 'from-orange-500/10 to-amber-500/10',
    purple: 'from-purple-500/10 to-indigo-500/10',
    green: 'from-green-500/10 to-emerald-500/10',
    blue: 'from-blue-500/10 to-cyan-500/10',
    rose: 'from-rose-500/10 to-pink-500/10',
  }

  const variantBadge: Record<ToolActionCardVariant, string> = {
    orange: 'from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 shadow-orange-500/25',
    purple: 'from-indigo-400 via-purple-400 to-fuchsia-300 text-white shadow-purple-500/25',
    green: 'from-emerald-400 via-lime-400 to-green-200 text-slate-900 shadow-emerald-500/25',
    blue: 'from-sky-400 via-blue-400 to-cyan-200 text-slate-900 shadow-sky-500/25',
    rose: 'from-rose-400 via-pink-400 to-amber-200 text-slate-900 shadow-rose-500/25',
  }

  const resolvedGradient = gradient ?? variantGradients[variant]

  const cardContent = (
    <>
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-white/5 to-white/0 text-xl"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <h3 className="text-lg font-semibold text-orange-50">{title}</h3>
      </div>

      {description && (
        <p className="text-sm text-orange-100/80 mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {children}

      {ctaLabel && (
        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 bg-gradient-to-r ${variantBadge[variant]} text-sm font-semibold shadow-lg transition group-hover:scale-[1.02] ${disabled ? 'opacity-60' : ''}`}
        >
          {ctaLabel}
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
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      )}
    </>
  )

  const baseStyles = `group rounded-2xl border border-orange-500/20 bg-gradient-to-br ${resolvedGradient} p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] transition ${
    disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-orange-400/30'
  } focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${className}`

  if (href && !disabled) {
    return (
      <Link href={href} className={`block ${baseStyles}`}>
        {cardContent}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`text-left ${baseStyles}`} disabled={disabled}>
      {cardContent}
    </button>
  )
}

export default ToolActionCard
