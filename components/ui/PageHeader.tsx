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
    <header className={`mb-6 sm:mb-8 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && <div className="mb-3">{breadcrumbs}</div>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Back button */}
          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--mv-border)] bg-white/5 text-[var(--mv-text-primary)] transition hover:border-[var(--mv-border-strong)] hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/50 focus:ring-offset-2 focus:ring-offset-[#050507]"
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

          <div className="flex flex-col gap-1">
            <h1 className="text-balance text-left">
              {title}
            </h1>
            {subtitle && (
              <p className="text-pretty text-body leading-relaxed text-[var(--mv-text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">{actions}</div>
        )}
      </div>
    </header>
  )
}

export default PageHeader
