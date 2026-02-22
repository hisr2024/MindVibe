/**
 * Offline Status Banner
 * Shows connection status and cache information
 */

'use client'

import { useMemo } from 'react'
import { useOfflineMode } from '@/hooks/useOfflineMode'
import { useCacheManager } from '@/hooks/useCacheManager'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/hooks/useLanguage'

export function OfflineStatusBanner() {
  const { isOnline, queueCount, lastSyncTime } = useOfflineMode()
  const { stats } = useCacheManager()
  const { t } = useLanguage()

  const formattedLastSync = useMemo(() => {
    if (!lastSyncTime) return t('divine.sacred.system.offline.never', 'Never')
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    const diff = now - lastSyncTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}${t('divine.sacred.system.offline.daysAgo', 'd ago')}`
    if (hours > 0) return `${hours}${t('divine.sacred.system.offline.hoursAgo', 'h ago')}`
    if (minutes > 0) return `${minutes}${t('divine.sacred.system.offline.minutesAgo', 'm ago')}`
    return t('divine.sacred.system.offline.justNow', 'Just now')
  }, [lastSyncTime, t])

  // Don't show banner if online and no queued operations
  if (isOnline && queueCount === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 shadow-lg"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-white">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
              <span className="font-medium">{t('divine.sacred.system.offline.youreOffline', "You're offline")}</span>
              <span className="hidden sm:inline text-white/80">
                • {stats.conversationCount} {t('divine.sacred.system.offline.conversationsCached', 'conversations cached')}
                • {stats.versesCount} {t('divine.sacred.system.offline.versesAvailable', 'verses available')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {queueCount > 0 && (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  {queueCount} {t('divine.sacred.system.offline.pending', 'pending')}
                </span>
              )}
              <span className="text-xs text-white/70">
                {t('divine.sacred.system.offline.lastSync', 'Last sync')}: {formattedLastSync}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
