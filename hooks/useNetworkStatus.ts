'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown'
export type ConnectionQuality = 'poor' | 'moderate' | 'good' | 'excellent'

export interface NetworkStatus {
  /** Whether the device is online */
  isOnline: boolean
  /** Whether the connection was recently lost */
  wasOffline: boolean
  /** Effective connection type */
  connectionType: ConnectionType
  /** Quality assessment */
  quality: ConnectionQuality
  /** Downlink speed in Mbps */
  downlink: number | null
  /** Round-trip time in ms */
  rtt: number | null
  /** Whether data saver is enabled */
  saveData: boolean
  /** Time since last online in ms */
  offlineDuration: number | null
  /** Timestamp of last status change */
  lastChange: number
}

interface NetworkConnection {
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
  addEventListener?: (type: string, listener: () => void) => void
  removeEventListener?: (type: string, listener: () => void) => void
}

const getConnectionType = (connection: NetworkConnection | undefined): ConnectionType => {
  if (!connection?.effectiveType) return 'unknown'
  const type = connection.effectiveType.toLowerCase()
  if (type === 'slow-2g') return 'slow-2g'
  if (type === '2g') return '2g'
  if (type === '3g') return '3g'
  if (type === '4g') return '4g'
  return 'unknown'
}

const getConnectionQuality = (connectionType: ConnectionType, rtt: number | null): ConnectionQuality => {
  if (connectionType === 'slow-2g' || connectionType === '2g') return 'poor'
  if (connectionType === '3g') return 'moderate'
  if (connectionType === '4g') {
    if (rtt && rtt > 200) return 'moderate'
    if (rtt && rtt > 100) return 'good'
    return 'excellent'
  }
  if (rtt && rtt < 50) return 'excellent'
  if (rtt && rtt < 150) return 'good'
  if (rtt && rtt < 300) return 'moderate'
  return 'moderate'
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        wasOffline: false,
        connectionType: 'unknown',
        quality: 'good',
        downlink: null,
        rtt: null,
        saveData: false,
        offlineDuration: null,
        lastChange: Date.now(),
      }
    }

    const connection = (navigator as { connection?: NetworkConnection }).connection
    const connectionType = getConnectionType(connection)

    return {
      isOnline: navigator.onLine,
      wasOffline: false,
      connectionType,
      quality: getConnectionQuality(connectionType, connection?.rtt ?? null),
      downlink: connection?.downlink ?? null,
      rtt: connection?.rtt ?? null,
      saveData: connection?.saveData ?? false,
      offlineDuration: null,
      lastChange: Date.now(),
    }
  })

  const offlineStartRef = useRef<number | null>(null)
  const wasOfflineTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as { connection?: NetworkConnection }).connection
    const connectionType = getConnectionType(connection)

    setStatus(prev => ({
      ...prev,
      connectionType,
      quality: getConnectionQuality(connectionType, connection?.rtt ?? null),
      downlink: connection?.downlink ?? null,
      rtt: connection?.rtt ?? null,
      saveData: connection?.saveData ?? false,
      lastChange: Date.now(),
    }))
  }, [])

  const handleOnline = useCallback(() => {
    const offlineDuration = offlineStartRef.current
      ? Date.now() - offlineStartRef.current
      : null
    offlineStartRef.current = null

    setStatus(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: true,
      offlineDuration,
      lastChange: Date.now(),
    }))

    // Clear wasOffline after 5 seconds (with cleanup)
    if (wasOfflineTimeoutRef.current) {
      clearTimeout(wasOfflineTimeoutRef.current)
    }
    wasOfflineTimeoutRef.current = setTimeout(() => {
      setStatus(prev => ({ ...prev, wasOffline: false }))
      wasOfflineTimeoutRef.current = null
    }, 5000)

    updateNetworkInfo()
  }, [updateNetworkInfo])

  const handleOffline = useCallback(() => {
    offlineStartRef.current = Date.now()
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      offlineDuration: null,
      lastChange: Date.now(),
    }))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const connection = (navigator as { connection?: NetworkConnection }).connection
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateNetworkInfo)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateNetworkInfo)
      }

      // Cleanup pending timeout
      if (wasOfflineTimeoutRef.current) {
        clearTimeout(wasOfflineTimeoutRef.current)
      }
    }
  }, [handleOnline, handleOffline, updateNetworkInfo])

  return status
}

/**
 * Returns true if the connection is slow or data saver is enabled
 */
export function useShouldReduceData(): boolean {
  const { connectionType, saveData, quality } = useNetworkStatus()
  return saveData || quality === 'poor' || connectionType === 'slow-2g' || connectionType === '2g'
}

/**
 * Returns true if animations should be reduced due to network conditions
 */
export function useShouldReduceAnimations(): boolean {
  const { quality, saveData } = useNetworkStatus()

  // Also check prefers-reduced-motion
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return prefersReduced || saveData || quality === 'poor'
}

/**
 * Hook to check if we should preload/prefetch resources
 */
export function useCanPrefetch(): boolean {
  const { isOnline, quality, saveData } = useNetworkStatus()
  return isOnline && !saveData && (quality === 'good' || quality === 'excellent')
}

export default useNetworkStatus
