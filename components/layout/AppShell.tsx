'use client'

/**
 * AppShell — Shared layout shell for Kiaanverse app pages.
 *
 * Provides:
 *   - Sidebar (220px, desktop only, CSS-hidden on mobile)
 *   - Topbar (56px, desktop only, OM wordmark + SACRED badge + avatar)
 *   - Main content area (flex-1, overflow-y-auto)
 *   - Optional right panel (320px, desktop only)
 *
 * Used in individual route layouts (dashboard, kiaan, etc.) — not in the
 * root layout — so public pages (landing, pricing) are unaffected.
 * On mobile, navigation is handled by the root layout's SiteNav + MobileNav.
 */

import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export interface AppShellProps {
  children: ReactNode
  /** Optional right panel content (e.g. chat page's verse/topics panel). */
  rightPanel?: ReactNode
  /** Extra className on the main content area. */
  className?: string
}

export function AppShell({ children, rightPanel, className = '' }: AppShellProps) {
  return (
    <>
      <Sidebar />

      <div className={`flex-1 min-w-0 flex flex-col lg:overflow-hidden ${className}`}>
        <Topbar />

        {/* Use <div> instead of <main> — the root layout's MobileContentWrapper
             already renders the landmark <main> element. Nesting <main> inside
             <main> is invalid HTML and triggers console warnings. */}
        <div className="flex-1 min-h-0 overflow-y-auto lg:flex lg:overflow-hidden">
          <div className="flex-1 min-w-0 lg:overflow-y-auto">
            {children}
          </div>

          {rightPanel && (
            <aside
              className="hidden lg:flex lg:flex-col lg:w-[320px] lg:shrink-0 overflow-y-auto"
              style={{
                borderLeft: '1px solid rgba(212, 160, 23, 0.1)',
                background: 'rgba(13, 13, 31, 0.8)',
              }}
            >
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
