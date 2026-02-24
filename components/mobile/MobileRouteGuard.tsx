'use client'

/**
 * MobileRouteGuard
 *
 * Hides its children when the current route is under /m/* (the dedicated mobile interface).
 * This prevents the root layout's SiteNav, MobileNav, KiaanFooter, and KiaanVoiceFAB
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

  if (isMobileRoute) {
    return null
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

  if (isMobileRoute) {
    return (
      <div id="main-content" className="mobile-app-root">
        {children}
      </div>
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
