'use client'

import { type ReactNode } from 'react'
import { PageHeader, type PageHeaderProps } from '@/components/ui/PageHeader'

export interface PageLayoutProps {
  /** Child content to render within the layout */
  children: ReactNode
  /** Page header configuration */
  header?: PageHeaderProps
  /** Maximum width constraint for content */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full'
  /** Additional padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** Optional className for the container */
  className?: string
  /** Whether to show bottom padding for mobile nav */
  withMobileNav?: boolean
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  full: 'max-w-full',
}

const paddingClasses = {
  none: '',
  sm: 'px-4 py-4',
  md: 'px-4 py-6 sm:px-6 lg:px-8',
  lg: 'px-4 py-8 sm:px-6 lg:px-8',
}

/**
 * PageLayout component for consistent page structure.
 *
 * Features:
 * - Standard navigation integration (desktop/mobile)
 * - Page header support
 * - Content area with max-width constraint
 * - Proper spacing
 * - Responsive breakpoints
 */
export function PageLayout({
  children,
  header,
  maxWidth = '6xl',
  padding = 'md',
  className = '',
  withMobileNav = true,
}: PageLayoutProps) {
  return (
    <main
      className={`min-h-screen ${paddingClasses[padding]} ${withMobileNav ? 'pb-20 md:pb-0' : ''} ${className}`}
    >
      <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
        {header && <PageHeader {...header} />}
        {children}
      </div>
    </main>
  )
}

export default PageLayout
