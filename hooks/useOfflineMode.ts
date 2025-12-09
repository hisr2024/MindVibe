/**
 * useOfflineMode Hook
 * Provides offline state management and caching capabilities
 */

import { useState, useEffect, useCallback } from 'react'
import { offlineManager, OfflineState } from '@/lib/offline/manager'

export function useOfflineMode() {
  const [state, setState] = useState<OfflineState>(() => offlineManager.getState())

  useEffect(() => {
    // Subscribe to offline manager state changes
    const unsubscribe = offlineManager.subscribe((newState) => {
      setState(newState)
    })

    return unsubscribe
  }, [])

  const queueOperation = useCallback(
    async (
      type: 'POST' | 'PUT' | 'DELETE',
      endpoint: string,
      data?: unknown
    ) => {
      await offlineManager.queueOperation({ type, endpoint, data })
    },
    []
  )

  const syncNow = useCallback(async () => {
    await offlineManager.forceSyncNow()
  }, [])

  const clearQueue = useCallback(async () => {
    await offlineManager.clearQueue()
  }, [])

  const getOfflineFallback = useCallback(async (endpoint: string) => {
    return offlineManager.getOfflineFallback(endpoint)
  }, [])

  const cacheResponse = useCallback(
    async (key: string, response: unknown, ttl?: number) => {
      await offlineManager.cacheResponse(key, response, ttl)
    },
    []
  )

  return {
    isOnline: state.isOnline,
    queuedOperations: state.queuedOperations,
    queueCount: state.queuedOperations.length,
    lastSyncTime: state.lastSyncTime,
    syncInProgress: state.syncInProgress,
    queueOperation,
    syncNow,
    clearQueue,
    getOfflineFallback,
    cacheResponse,
  }
}
