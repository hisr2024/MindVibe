/**
 * useCacheManager Hook
 * Provides cache management and storage utilities
 */

import { useState, useEffect, useCallback } from 'react'
import { indexedDBManager, STORES } from '@/lib/offline/indexedDB'

interface CacheStats {
  conversationCount: number
  versesCount: number
  cachedResponsesCount: number
  journalEntriesCount: number
  moodCheckInsCount: number
  wisdomCacheCount: number
  storageUsage: number
  storageQuota: number
}

export function useCacheManager() {
  const [stats, setStats] = useState<CacheStats>({
    conversationCount: 0,
    versesCount: 0,
    cachedResponsesCount: 0,
    journalEntriesCount: 0,
    moodCheckInsCount: 0,
    wisdomCacheCount: 0,
    storageUsage: 0,
    storageQuota: 0,
  })
  const [loading, setLoading] = useState(false)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const [
        conversationCount,
        versesCount,
        cachedResponsesCount,
        journalEntriesCount,
        moodCheckInsCount,
        wisdomCacheCount,
        storageEstimate,
      ] = await Promise.all([
        indexedDBManager.count(STORES.CONVERSATIONS),
        indexedDBManager.count(STORES.GITA_VERSES),
        indexedDBManager.count(STORES.CACHED_RESPONSES),
        indexedDBManager.count(STORES.JOURNAL_ENTRIES),
        indexedDBManager.count(STORES.MOOD_CHECKINS),
        indexedDBManager.count(STORES.WISDOM_CACHE),
        indexedDBManager.getStorageEstimate(),
      ])

      setStats({
        conversationCount,
        versesCount,
        cachedResponsesCount,
        journalEntriesCount,
        moodCheckInsCount,
        wisdomCacheCount,
        storageUsage: storageEstimate?.usage || 0,
        storageQuota: storageEstimate?.quota || 0,
      })
    } catch (error) {
      console.error('Failed to load cache stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const clearCache = useCallback(async (storeName?: string) => {
    setLoading(true)
    try {
      if (storeName) {
        await indexedDBManager.clear(storeName)
      } else {
        // Clear all stores except critical data
        await Promise.all([
          indexedDBManager.clear(STORES.CACHED_RESPONSES),
          indexedDBManager.clear(STORES.WISDOM_CACHE),
        ])
      }
      await loadStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    } finally {
      setLoading(false)
    }
  }, [loadStats])

  const cleanupExpired = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        indexedDBManager.cleanupExpired(STORES.CACHED_RESPONSES),
        indexedDBManager.cleanupExpired(STORES.WISDOM_CACHE),
      ])
      await loadStats()
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error)
    } finally {
      setLoading(false)
    }
  }, [loadStats])

  const getStorageUsageMB = useCallback(() => {
    return (stats.storageUsage / (1024 * 1024)).toFixed(2)
  }, [stats.storageUsage])

  const getStorageQuotaMB = useCallback(() => {
    return (stats.storageQuota / (1024 * 1024)).toFixed(2)
  }, [stats.storageQuota])

  const getUsagePercentage = useCallback(() => {
    if (stats.storageQuota === 0) return 0
    return ((stats.storageUsage / stats.storageQuota) * 100).toFixed(1)
  }, [stats.storageUsage, stats.storageQuota])

  return {
    stats,
    loading,
    loadStats,
    clearCache,
    cleanupExpired,
    getStorageUsageMB,
    getStorageQuotaMB,
    getUsagePercentage,
  }
}
