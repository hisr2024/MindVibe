/**
 * Offline Mode Toggle
 * Manual offline mode control and cache information
 */

'use client'

import { useState } from 'react'
import { useCacheManager } from '@/hooks/useCacheManager'
import { useOfflineMode } from '@/hooks/useOfflineMode'

export function OfflineModeToggle() {
  const { stats, loading, clearCache, getStorageUsageMB, getStorageQuotaMB, getUsagePercentage } = useCacheManager()
  const { isOnline, queueCount } = useOfflineMode()
  const [showDetails, setShowDetails] = useState(false)

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the cache? This will remove cached conversations and responses.')) {
      await clearCache()
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
          <div>
            <h3 className="text-sm font-medium text-slate-200">
              {isOnline ? 'Online' : 'Offline Mode'}
            </h3>
            <p className="text-xs text-slate-400">
              {stats.conversationCount} conversations cached
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-400">Cached Conversations</p>
              <p className="font-medium text-slate-200">{stats.conversationCount}</p>
            </div>
            <div>
              <p className="text-slate-400">Wisdom Verses</p>
              <p className="font-medium text-slate-200">{stats.versesCount}</p>
            </div>
            <div>
              <p className="text-slate-400">Journal Entries</p>
              <p className="font-medium text-slate-200">{stats.journalEntriesCount}</p>
            </div>
            <div>
              <p className="text-slate-400">Mood Check-ins</p>
              <p className="font-medium text-slate-200">{stats.moodCheckInsCount}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-800/50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-400">Storage Used</span>
              <span className="font-medium text-slate-200">
                {getStorageUsageMB()} MB / {getStorageQuotaMB()} MB
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {getUsagePercentage()}% used
            </p>
          </div>

          {queueCount > 0 && (
            <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-400">
              <p className="font-medium">⏳ {queueCount} operations queued</p>
              <p className="mt-1 text-amber-400/70">
                Will sync automatically when connection is restored
              </p>
            </div>
          )}

          <button
            onClick={handleClearCache}
            disabled={loading}
            className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {loading ? 'Clearing...' : 'Clear Cache'}
          </button>
        </div>
      )}
    </div>
  )
}
