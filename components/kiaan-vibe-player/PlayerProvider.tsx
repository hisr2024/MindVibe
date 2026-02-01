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
      <FloatingPlayer />
    </>
  )
}

export default KiaanVibePlayerProvider
