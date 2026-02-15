/**
 * Sync Status Widget
 * Real-time sync indicator with queue information
 */

'use client'

import { useMemo } from 'react'
import { useOfflineMode } from '@/hooks/useOfflineMode'
import { motion } from 'framer-motion'

export function SyncStatusWidget() {
  const { isOnline, queueCount, syncInProgress, lastSyncTime, syncNow } = useOfflineMode()

  const formattedLastSync = useMemo(() => {
    if (!lastSyncTime) return 'Never synced'
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const diff = now - lastSyncTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `Synced ${hours}h ago`
    if (minutes > 0) return `Synced ${minutes}m ago`
    return 'Just synced'
  }, [lastSyncTime])

  const handleSyncNow = async () => {
    if (isOnline && !syncInProgress) {
      await syncNow()
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2">
      {/* Status Indicator */}
      <div className="relative">
        {syncInProgress ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-5 w-5"
          >
            <svg
              className="text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </motion.div>
        ) : (
          <div
            className={`h-2 w-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            } ${isOnline ? 'animate-pulse' : ''}`}
          />
        )}
      </div>

      {/* Status Text */}
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-300">
          {syncInProgress ? 'Syncing...' : formattedLastSync}
        </p>
        {queueCount > 0 && (
          <p className="text-xs text-slate-500">
            {queueCount} operation{queueCount === 1 ? '' : 's'} pending
          </p>
        )}
      </div>

      {/* Sync Now Button */}
      {isOnline && queueCount > 0 && !syncInProgress && (
        <button
          onClick={handleSyncNow}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          Sync Now
        </button>
      )}
    </div>
  )
}
