'use client'

/**
 * AppShell — Shared layout shell for Kiaanverse app pages.
 *
 * Provides:
 *   - Sidebar (220px, desktop only, CSS-hidden on mobile)
 *   - Topbar (56px, OM wordmark + badges; hamburger on mobile)
 *   - Main content area (flex-1, overflow-y-auto)
 *   - Optional right panel (320px, desktop only)
 *
 * Used in individual route layouts (dashboard, kiaan, etc.) — not in the
 * root layout — so public pages (landing, pricing) are unaffected.
 *
 * Mobile sidebar is a CSS transform drawer, controlled via hamburger icon
 * in the mobile Topbar.
 */

import { useState, useCallback, type ReactNode } from 'react'
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
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  return (
    <>
      <Sidebar open={drawerOpen} onClose={closeDrawer} />

      <div className={`flex-1 min-w-0 flex flex-col lg:overflow-hidden ${className}`}>
        <Topbar onMenuToggle={toggleDrawer} />

        <main className="flex-1 min-h-0 overflow-y-auto lg:flex lg:overflow-hidden">
          <div className="flex-1 min-w-0 lg:overflow-y-auto">
            {children}
          </div>

          {rightPanel && (
            <aside
              className="hidden lg:flex lg:flex-col lg:w-[320px] lg:shrink-0 overflow-y-auto"
              style={{
                borderLeft: '1px solid rgba(180, 140, 60, 0.1)',
                background: 'rgba(13, 13, 31, 0.8)',
              }}
            >
              {rightPanel}
            </aside>
          )}
        </main>
      </div>
    </>
  )
}
