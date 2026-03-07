'use client'

/**
 * KIAAN Vibe Player Provider
 *
 * Wraps the app with player context and renders the FloatingPlayer.
 * This should be placed near the root of the app.
 */

import React, { useEffect } from 'react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { FloatingPlayer } from './FloatingPlayer'
import ErrorBoundary from '@/components/ErrorBoundary'

interface KiaanVibePlayerProviderProps {
  children: React.ReactNode
}

export function KiaanVibePlayerProvider({ children }: KiaanVibePlayerProviderProps) {
  // Load persisted state on mount
  useEffect(() => {
    usePlayerStore.getState().loadPersistedState()
  }, [])

  return (
    <>
      {children}
      <ErrorBoundary fallback={null}>
        <FloatingPlayer />
      </ErrorBoundary>
    </>
  )
}

export default KiaanVibePlayerProvider
