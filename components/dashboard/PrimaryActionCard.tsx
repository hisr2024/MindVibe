'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

export interface PrimaryActionCardProps {
  /** Icon to display */
  icon?: ReactNode
  /** Title of the action */
  title: string
  /** Description text */
  description: string
  /** Link destination */
  href: string
  /** Button text */
  buttonText?: string
  /** Gradient background style */
  variant?: 'sunrise' | 'ocean' | 'aurora' | 'indigo'
  /** Optional className for styling */
  className?: string
}

const variantStyles = {
  sunrise: {
    background: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-400',
    text: 'text-slate-900',
    buttonBg: 'bg-white/20 hover:bg-white/30',
    buttonText: 'text-slate-900',
  },
  ocean: {
    background: 'bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600',
    text: 'text-white',
    buttonBg: 'bg-white/20 hover:bg-white/30',
    buttonText: 'text-white',
  },
  aurora: {
    background: 'bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500',
    text: 'text-white',
    buttonBg: 'bg-white/20 hover:bg-white/30',
    buttonText: 'text-white',
  },
  indigo: {
    background: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600',
    text: 'text-white',
    buttonBg: 'bg-white/20 hover:bg-white/30',
    buttonText: 'text-white',
  },
}

/**
 * PrimaryActionCard component for prominent dashboard actions.
 *
 * Features:
 * - Eye-catching gradient background
 * - Icon support
 * - Clear call-to-action
 * - Multiple color variants
 */
export function PrimaryActionCard({
  icon,
  title,
  description,
  href,
  buttonText = 'Get Started',
  variant = 'indigo',
  className = '',
}: PrimaryActionCardProps) {
  const styles = variantStyles[variant]

  return (
    <Link
      href={href}
      className={`group block rounded-2xl p-6 shadow-lg transition hover:shadow-xl hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 ${styles.background} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {icon && (
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <span className={styles.text}>{icon}</span>
            </div>
          )}
          <h3 className={`text-lg font-semibold ${styles.text}`}>{title}</h3>
          <p className={`mt-1 text-sm opacity-90 ${styles.text}`}>
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <span
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${styles.buttonBg} ${styles.buttonText}`}
        >
          {buttonText}
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
      </div>
    </Link>
  )
}

export default PrimaryActionCard
