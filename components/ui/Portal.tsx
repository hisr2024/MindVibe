'use client'

import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Portal component that renders children into a DOM node outside
 * the normal React component tree. This is essential for modals,
 * tooltips, and overlays to escape parent stacking contexts.
 *
 * Features:
 * - SSR-safe (only renders portal client-side)
 * - Uses useLayoutEffect to mount synchronously before browser paint,
 *   preventing flicker when used with overlays
 * - Supports custom container targeting via id
 * - Falls back to document.body if container not found
 * - Proper cleanup on unmount
 */
export interface PortalProps {
  /** Content to render in the portal */
  children: ReactNode
  /** ID of the container element to portal into (defaults to 'overlay-root') */
  containerId?: string
}

export function Portal({ children, containerId = 'overlay-root' }: PortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // useLayoutEffect fires synchronously after DOM mutations but BEFORE
  // the browser paints. This eliminates the 1-frame flash where the portal
  // target doesn't exist yet and children render as null.
  useLayoutEffect(() => {
    let targetContainer = document.getElementById(containerId)

    if (!targetContainer) {
      targetContainer = document.createElement('div')
      targetContainer.id = containerId
      targetContainer.setAttribute('data-overlay-root', 'true')
      document.body.appendChild(targetContainer)
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronous mount detection; must run before paint to prevent overlay flicker
    setContainer(targetContainer)
  }, [containerId])

  if (!container) {
    return null
  }

  return createPortal(children, container)
}

/**
 * Hook to check if portal is ready (client-side mounted)
 */
export function usePortalReady(): boolean {
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard mount detection for hydration safety
    setReady(true)
  }, [])

  return ready
}

export default Portal
