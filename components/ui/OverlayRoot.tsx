'use client'

import { useEffect } from 'react'

/**
 * OverlayRoot component - creates the portal container for all overlays.
 *
 * This component should be placed at the root of the app (in layout.tsx)
 * to ensure overlays render outside of any stacking contexts created by
 * parent components.
 *
 * The container:
 * - Has no visual styling (purely structural)
 * - Is positioned fixed to ensure it covers the viewport
 * - Has pointer-events: none so it doesn't block underlying content
 * - Child overlays should set pointer-events: auto
 *
 * Z-INDEX LAYER SYSTEM:
 * ─────────────────────
 * z-[9999] - Crisis alerts, critical modals
 * z-[100]  - Toasts, notifications
 * z-[80]   - Tooltips, popovers
 * z-[70]   - Modals, dialogs
 * z-[65]   - Bottom sheets, drawers
 * z-[60]   - Floating action buttons, chat widgets
 * z-[50]   - Mobile bottom navigation
 * z-[40]   - Fixed header navigation
 * z-[30]   - Backdrop overlays
 * z-[10]   - Content overlays
 */
export function OverlayRoot() {
  useEffect(() => {
    // Ensure the overlay root exists and is properly configured
    let root = document.getElementById('overlay-root')

    if (!root) {
      root = document.createElement('div')
      root.id = 'overlay-root'
      document.body.appendChild(root)
    }

    // Configure the root element
    root.setAttribute('data-overlay-root', 'true')
    root.style.position = 'fixed'
    root.style.inset = '0'
    root.style.pointerEvents = 'none'
    root.style.zIndex = '9998' // Just below highest z-index
    root.style.overflow = 'visible'
    // Ensure no clipping of children
    root.style.contain = 'none'

    return () => {
      // Don't remove the root on unmount - other components may depend on it
    }
  }, [])

  // This component doesn't render anything itself - it just ensures
  // the portal container exists. The actual content is rendered via Portal.
  return null
}

export default OverlayRoot
