'use client'

/**
 * MobileRouteGuard
 *
 * Hides its children when the current route is under /m/* (the dedicated mobile interface).
 * This prevents the root layout's SiteNav, MobileNav, and KiaanVoiceCompanionFooter
 * from rendering on top of the MobileAppShell's own navigation, avoiding duplicate
 * headers, tab bars, and floating elements.
 */

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface MobileRouteGuardProps {
  children: ReactNode
}

export function MobileRouteGuard({ children }: MobileRouteGuardProps) {
  const pathname = usePathname()
  const isMobileRoute = pathname === '/m' || pathname.startsWith('/m/')
  const isAppShellRoute =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/kiaan' || pathname.startsWith('/kiaan/')

  if (isMobileRoute) {
    return null
  }

  // Hide SiteNav on desktop for app-shell routes (they have their own Topbar+Sidebar)
  if (isAppShellRoute) {
    return <div className="lg:hidden">{children}</div>
  }

  return <>{children}</>
}

/**
 * AppShellFooterGuard
 *
 * Hides footer / bottom-bar children on desktop (lg:) when the current
 * route uses the AppShell layout (dashboard, kiaan).  On mobile the
 * children render normally because SiteFooter / MobileNav are still
 * useful there.
 *
 * Why: the AppShell uses `lg:h-screen lg:overflow-hidden` on its <main>,
 * but the footer sits OUTSIDE <main> as a sibling.  Without hiding it,
 * the <body> is taller than the viewport and scrolls on desktop.
 */
export function AppShellFooterGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAppShell =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/kiaan' || pathname.startsWith('/kiaan/')

  if (isAppShell) {
    return <div className="lg:hidden">{children}</div>
  }

  return <>{children}</>
}

/**
 * MobileContentWrapper
 *
 * On /m/* routes, renders children without the desktop <main> wrapper and its
 * padding/max-width constraints. On regular routes, renders inside the standard
 * constrained <main> element.
 */
interface MobileContentWrapperProps {
  children: ReactNode
}

export function MobileContentWrapper({ children }: MobileContentWrapperProps) {
  const pathname = usePathname()
  const isMobileRoute = pathname === '/m' || pathname.startsWith('/m/')
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isKiaan = pathname === '/kiaan' || pathname.startsWith('/kiaan/')

  if (isMobileRoute) {
    return (
      <div id="main-content" className="mobile-app-root">
        {children}
      </div>
    )
  }

  /*
   * Dashboard & KIAAN routes get a full-width flex-row shell on desktop (lg:)
   * so the Sidebar + scrollable content area can sit side-by-side.  Mobile
   * classes (below lg:) are identical to the default branch — no mobile change.
   */
  if (isDashboard || isKiaan) {
    return (
      <main
        id="main-content"
        className="flex w-full flex-col gap-6 px-4 pb-28 pt-20 sm:gap-8 sm:px-6 sm:pb-20 md:pb-10 lg:flex-row lg:gap-0 lg:px-0 lg:pb-0 lg:pt-0 lg:h-screen lg:overflow-hidden mobile-content-area"
      >
        {children}
      </main>
    )
  }

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-20 sm:gap-8 sm:px-6 sm:pb-20 md:pb-10 lg:px-8 lg:pt-24 mobile-content-area"
    >
      {children}
    </main>
  )
}
