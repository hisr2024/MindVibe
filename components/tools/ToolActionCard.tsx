'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

export interface ToolActionCardProps {
  /** Card title */
  title: string
  /** Card description */
  description?: string
  /** Icon or emoji */
  icon?: ReactNode
  /** Link URL */
  href?: string
  /** Click handler (alternative to href) */
  onClick?: () => void
  /** Gradient style variant */
  variant?: 'orange' | 'purple' | 'green' | 'blue' | 'rose'
  /** Whether the card is disabled */
  disabled?: boolean
  /** Additional className */
  className?: string
  /** Children content */
  children?: ReactNode
}

const variantStyles = {
  orange: {
    border: 'border-orange-500/20',
    bg: 'bg-gradient-to-br from-orange-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(255,115,39,0.12)]',
    iconBg: 'bg-orange-500/30',
    iconBorder: 'border-orange-400',
    text: 'text-orange-50',
    descText: 'text-orange-100/80',
  },
  purple: {
    border: 'border-purple-500/20',
    bg: 'bg-gradient-to-br from-purple-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(167,139,250,0.08)]',
    iconBg: 'bg-purple-500/30',
    iconBorder: 'border-purple-400',
    text: 'text-purple-50',
    descText: 'text-purple-100/80',
  },
  green: {
    border: 'border-green-500/20',
    bg: 'bg-gradient-to-br from-green-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(74,222,128,0.08)]',
    iconBg: 'bg-green-500/30',
    iconBorder: 'border-green-400',
    text: 'text-green-50',
    descText: 'text-green-100/80',
  },
  blue: {
    border: 'border-blue-500/20',
    bg: 'bg-gradient-to-br from-blue-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(96,165,250,0.08)]',
    iconBg: 'bg-blue-500/30',
    iconBorder: 'border-blue-400',
    text: 'text-blue-50',
    descText: 'text-blue-100/80',
  },
  rose: {
    border: 'border-rose-500/20',
    bg: 'bg-gradient-to-br from-rose-500/10 via-[#0d0d10]/85 to-[#0d0d10]/85',
    shadow: 'shadow-[0_15px_60px_rgba(251,113,133,0.08)]',
    iconBg: 'bg-rose-500/30',
    iconBorder: 'border-rose-400',
    text: 'text-rose-50',
    descText: 'text-rose-100/80',
  },
}

/**
 * ToolActionCard component for tool-specific action cards.
 *
 * Features:
 * - Multiple color variants
 * - Link or button functionality
 * - Icon support
 * - Accessibility attributes
 * - Responsive design
 */
export function ToolActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  variant = 'orange',
  disabled = false,
  className = '',
  children,
}: ToolActionCardProps) {
  const styles = variantStyles[variant]

  const cardContent = (
    <>
      <div className="flex items-center gap-3 mb-3">
        {icon && (
          <span
            className={`h-10 w-10 rounded-full ${styles.iconBg} border ${styles.iconBorder} flex items-center justify-center text-lg ${styles.text}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
      </div>
      {description && (
        <p className={`text-sm ${styles.descText} mb-3`}>{description}</p>
      )}
      {children}
    </>
  )

  const baseClasses = `rounded-2xl border ${styles.border} ${styles.bg} p-5 ${styles.shadow} transition-transform ${
    disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.01]'
  } ${className}`

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={`block ${baseClasses} focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
        role="article"
      >
        {cardContent}
      </Link>
    )
  }

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`block w-full text-left ${baseClasses} focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900`}
        aria-label={title}
      >
        {cardContent}
      </button>
    )
  }

  return (
    <div className={baseClasses} role="article">
      {cardContent}
    </div>
  )
}

export default ToolActionCard
