'use client'

import { type ReactNode } from 'react'

export interface PageHeaderProps {
  /** Main title of the page */
  title: string
  /** Optional subtitle or description */
  subtitle?: string
  /** Show back button with optional custom handler */
  showBackButton?: boolean
  /** Custom back button click handler */
  onBack?: () => void
  /** Action buttons to display on the right side */
  actions?: ReactNode
  /** Optional breadcrumbs component */
  breadcrumbs?: ReactNode
  /** Additional className for styling */
  className?: string
}

/**
 * PageHeader component for consistent page headers across the application.
 *
 * Features:
 * - Title and optional subtitle
 * - Back button with keyboard support
 * - Action buttons area
 * - Breadcrumb support
 * - Consistent spacing
 */
export function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  return (
    <header className={`mb-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && <div className="mb-3">{breadcrumbs}</div>}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {/* Back button */}
          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="M12 19L5 12L12 5" />
              </svg>
            </button>
          )}

          <div>
            <h1
              className="text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-gray-900"
              style={{ fontFamily: '"SF Pro Display", "Inter", sans-serif' }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-[15px] leading-[1.6] text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}

export default PageHeader
