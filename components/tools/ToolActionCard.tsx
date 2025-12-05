'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'

export type ToolActionCardVariant = 'orange' | 'purple' | 'green' | 'blue' | 'rose'

const variantGradients: Record<ToolActionCardVariant, string> = {
  orange: 'from-orange-500/10 to-amber-500/10',
  purple: 'from-purple-500/10 to-violet-500/10',
  green: 'from-green-500/10 to-emerald-500/10',
  blue: 'from-blue-500/10 to-cyan-500/10',
  rose: 'from-rose-500/10 to-pink-500/10',
}

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
  /** Card variant for styling */
  variant?: ToolActionCardVariant
  /** Whether the card is disabled */
  disabled?: boolean
  /** Additional className */
  className?: string
  /** Optional children content */
  children?: ReactNode
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
  className = '',
  children,
}: ToolActionCardProps) {
  const effectiveGradient = gradient ?? variantGradients[variant]

  const cardContent = (
    <>
      {(icon || title) && (
        <div className="flex items-center gap-3 mb-3">
          {icon && (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-xl"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <h3 className="text-lg font-semibold text-orange-50">{title}</h3>
        </div>
      )}
      {description && (
        <p className="text-sm text-orange-100/80 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {children}
      {ctaLabel && (
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 text-slate-950 text-sm font-semibold shadow-lg shadow-orange-500/25 transition group-hover:scale-[1.02]"
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

  const baseStyles = `group rounded-2xl border border-orange-500/20 bg-gradient-to-br ${effectiveGradient} p-5 shadow-[0_15px_60px_rgba(255,115,39,0.12)] transition hover:border-orange-400/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${className}`

  if (disabled) {
    return (
      <div className={`${baseStyles} opacity-50 cursor-not-allowed`}>
        {cardContent}
      </div>
    )
  }

  if (href) {
    return (
      <Link href={href} className={`block ${baseStyles}`}>
        {cardContent}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`text-left ${baseStyles}`}>
      {cardContent}
    </button>
  )
}

export default ToolActionCard
