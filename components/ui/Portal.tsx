'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Portal component that renders children into a DOM node outside
 * the normal React component tree. This is essential for modals,
 * tooltips, and overlays to escape parent stacking contexts.
 *
 * Features:
 * - SSR-safe (only renders portal client-side)
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
  const [mounted, setMounted] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)

    // Try to find the specified container, fall back to body
    let targetContainer = document.getElementById(containerId)

    if (!targetContainer) {
      // Create the overlay root if it doesn't exist
      targetContainer = document.createElement('div')
      targetContainer.id = containerId
      targetContainer.setAttribute('data-overlay-root', 'true')
      // Ensure it's at the top level for proper z-index stacking
      document.body.appendChild(targetContainer)
    }

    setContainer(targetContainer)

    return () => {
      // Don't remove the container on unmount - it's shared
    }
  }, [containerId])

  // Don't render anything on server or before mount
  if (!mounted || !container) {
    return null
  }

  return createPortal(children, container)
}

/**
 * Hook to check if portal is ready (client-side mounted)
 */
export function usePortalReady(): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return ready
}

export default Portal
