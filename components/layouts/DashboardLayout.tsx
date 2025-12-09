'use client'

import { type ReactNode } from 'react'

export interface DashboardLayoutProps {
  /** Child content to render within the grid */
  children: ReactNode
  /** Number of columns on different breakpoints */
  columns?: {
    mobile?: 1 | 2
    tablet?: 2 | 3
    desktop?: 2 | 3 | 4
  }
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg'
  /** Optional className for styling */
  className?: string
}

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
}

/**
 * DashboardLayout component for grid-based dashboard layouts.
 *
 * Features:
 * - Responsive columns (1 on mobile, 2-3 on tablet, 2-4 on desktop)
 * - Card-based sections
 * - Consistent gaps
 * - Flexible configuration
 */
export function DashboardLayout({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}: DashboardLayoutProps) {
  // Build column classes based on configuration
  const mobileColumns = columns.mobile === 2 ? 'grid-cols-2' : 'grid-cols-1'
  const tabletColumns = columns.tablet === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
  const desktopColumns =
    columns.desktop === 4
      ? 'lg:grid-cols-4'
      : columns.desktop === 2
        ? 'lg:grid-cols-2'
        : 'lg:grid-cols-3'

  return (
    <div
      className={`grid ${mobileColumns} ${tabletColumns} ${desktopColumns} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  )
}

/**
 * DashboardSection component for grouping related dashboard content.
 */
export interface DashboardSectionProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Child content */
  children: ReactNode
  /** Optional className */
  className?: string
}

export function DashboardSection({
  title,
  description,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}

export default DashboardLayout
