'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'

export interface SecondaryActionCardProps {
  /** Icon to display */
  icon?: ReactNode
  /** Title of the action */
  title: string
  /** Description text */
  description?: string
  /** Link destination */
  href: string
  /** Optional metric or stat to display */
  metric?: {
    value: string | number
    label: string
  }
  /** Optional className for styling */
  className?: string
}

/**
 * SecondaryActionCard component for less prominent dashboard actions.
 *
 * Features:
 * - Clean white background
 * - Subtle hover effects
 * - Optional metric display
 * - Compact design
 */
export function SecondaryActionCard({
  icon,
  title,
  description,
  href,
  metric,
  className = '',
}: SecondaryActionCardProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${className}`}
    >
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-600">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 truncate">{description}</p>
        )}
      </div>

      {metric && (
        <div className="shrink-0 text-right">
          <div className="text-lg font-semibold text-gray-900">
            {metric.value}
          </div>
          <div className="text-xs text-gray-500">{metric.label}</div>
        </div>
      )}

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
        className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500"
        aria-hidden="true"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

export default SecondaryActionCard
