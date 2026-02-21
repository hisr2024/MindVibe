/**
 * Sync Status Widget
 * Real-time sync indicator with queue information
 */

'use client'

import { useMemo } from 'react'
import { useOfflineMode } from '@/hooks/useOfflineMode'
import { motion } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'

export function SyncStatusWidget() {
  const { isOnline, queueCount, syncInProgress, lastSyncTime, syncNow } = useOfflineMode()
  const { t } = useLanguage()

  const formattedLastSync = useMemo(() => {
    if (!lastSyncTime) return t('divine.sacred.system.sync.neverSynced', 'Never synced')
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const diff = now - lastSyncTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${t('divine.sacred.system.sync.syncedHoursAgo', 'Synced {hours}h ago').replace('{hours}', String(hours))}`
    if (minutes > 0) return `${t('divine.sacred.system.sync.syncedMinutesAgo', 'Synced {minutes}m ago').replace('{minutes}', String(minutes))}`
    return t('divine.sacred.system.sync.justSynced', 'Just synced')
  }, [lastSyncTime, t])

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
          {syncInProgress ? t('divine.sacred.system.sync.syncing', 'Syncing...') : formattedLastSync}
        </p>
        {queueCount > 0 && (
          <p className="text-xs text-slate-500">
            {queueCount} {queueCount === 1 ? t('divine.sacred.system.sync.operationPending', 'operation pending') : t('divine.sacred.system.sync.operationsPending', 'operations pending')}
          </p>
        )}
      </div>

      {/* Sync Now Button */}
      {isOnline && queueCount > 0 && !syncInProgress && (
        <button
          onClick={handleSyncNow}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
        >
          {t('divine.sacred.system.sync.syncNow', 'Sync Now')}
        </button>
      )}
    </div>
  )
}
