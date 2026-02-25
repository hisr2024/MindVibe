'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface LogEntry {
  timestamp: string
  level: string
  logger: string
  message: string
}

interface LogStats {
  total: number
  buffer_capacity: number
  by_level: Record<string, number>
}

const LEVEL_STYLES: Record<string, string> = {
  DEBUG: 'text-slate-400',
  INFO: 'text-blue-400',
  WARNING: 'text-yellow-400',
  ERROR: 'text-red-400',
  CRITICAL: 'text-red-300 font-bold',
}

const LEVEL_BADGE: Record<string, string> = {
  DEBUG: 'bg-slate-700 text-slate-300',
  INFO: 'bg-blue-900/50 text-blue-300',
  WARNING: 'bg-yellow-900/50 text-yellow-300',
  ERROR: 'bg-red-900/50 text-red-300',
  CRITICAL: 'bg-red-800 text-red-200',
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + String(d.getMilliseconds()).padStart(3, '0')
  } catch {
    return iso
  }
}

function highlightMessage(msg: string): string {
  // Highlight success markers
  if (msg.includes('[SUCCESS]') || msg.startsWith('✅')) return 'text-green-400'
  // Highlight errors
  if (msg.includes('[ERROR]') || msg.includes('❌') || msg.includes('Failed')) return 'text-red-400'
  // Highlight warnings
  if (msg.includes('⚠️') || msg.includes('not installed') || msg.includes('not available') || msg.includes('not configured')) return 'text-yellow-400'
  // Highlight startup sections
  if (msg.startsWith('===') || msg.startsWith('---')) return 'text-[#d4a44c] font-bold'
  // Request logs
  if (msg.startsWith('Request started:') || msg.startsWith('Request completed:')) return 'text-slate-400'
  if (msg.startsWith('INFO:')) return 'text-slate-500'
  return 'text-slate-200'
}

export default function BackendLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [levelFilter, setLevelFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [limit, setLimit] = useState(200)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: String(limit) })
      if (levelFilter) params.set('level', levelFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`${API_BASE_URL}/api/admin/backend-logs?${params}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      setLogs(data.logs || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }, [limit, levelFilter, searchQuery])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/backend-logs/stats`, {
        credentials: 'include',
      })
      if (res.ok) {
        setStats(await res.json())
      }
    } catch {
      // Stats are non-critical
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [fetchLogs, fetchStats])

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs()
        fetchStats()
      }, refreshInterval * 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refreshInterval, fetchLogs, fetchStats])

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Backend Logs</h1>
          <p className="text-sm text-slate-400">
            Live application logs from the FastAPI backend
          </p>
        </div>
        <button
          onClick={() => { fetchLogs(); fetchStats() }}
          className="rounded-lg bg-[#c8943a] px-4 py-2 text-sm font-medium text-white hover:bg-[#d4a44c] transition"
        >
          Refresh Now
        </button>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-lg font-semibold text-slate-100">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
            <p className="text-xs text-slate-400">Buffer</p>
            <p className="text-lg font-semibold text-slate-100">
              {stats.total}/{stats.buffer_capacity}
            </p>
          </div>
          {Object.entries(stats.by_level).map(([level, count]) => (
            <div key={level} className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2">
              <p className="text-xs text-slate-400">{level}</p>
              <p className={`text-lg font-semibold ${LEVEL_STYLES[level] || 'text-slate-100'}`}>
                {count}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Level filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value="">All Levels</option>
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARNING">WARNING</option>
          <option value="ERROR">ERROR</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        {/* Search */}
        <div className="flex">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-l-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 w-48"
          />
          <button
            onClick={handleSearch}
            className="rounded-r-lg border border-l-0 border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600"
          >
            Search
          </button>
        </div>

        {/* Limit */}
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-200"
        >
          <option value={100}>100 lines</option>
          <option value={200}>200 lines</option>
          <option value={500}>500 lines</option>
          <option value={1000}>1000 lines</option>
          <option value={2000}>All (2000)</option>
        </select>

        <div className="flex-1" />

        {/* Auto-refresh toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-slate-600"
          />
          Auto-refresh
        </label>
        {autoRefresh && (
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
          >
            <option value={2}>2s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={30}>30s</option>
          </select>
        )}

        {/* Auto-scroll toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-slate-600"
          />
          Auto-scroll
        </label>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
          Failed to fetch logs: {error}
        </div>
      )}

      {/* Log output */}
      <div
        ref={logContainerRef}
        className="h-[calc(100vh-380px)] min-h-[400px] overflow-auto rounded-xl border border-slate-700 bg-[#0d1117] font-mono text-xs leading-5"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            No logs found{levelFilter ? ` for level ${levelFilter}` : ''}{searchQuery ? ` matching "${searchQuery}"` : ''}
          </div>
        ) : (
          <table className="w-full">
            <tbody>
              {/* Logs are newest-first from API; reverse for terminal-like display (oldest at top) */}
              {[...logs].reverse().map((log, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-800/40 border-b border-slate-800/30"
                >
                  <td className="whitespace-nowrap px-2 py-0.5 text-slate-600 align-top select-none w-[80px]">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-1 py-0.5 align-top w-[70px]">
                    <span className={`inline-block rounded px-1.5 py-0 text-[10px] font-medium ${LEVEL_BADGE[log.level] || 'bg-slate-700 text-slate-300'}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className={`px-2 py-0.5 whitespace-pre-wrap break-all ${highlightMessage(log.message)}`}>
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {logs.length} log entries
          {levelFilter && ` (filtered: ${levelFilter})`}
          {searchQuery && ` (search: "${searchQuery}")`}
        </span>
        <span>
          Buffer: {stats?.total ?? '?'} / {stats?.buffer_capacity ?? '?'} entries
        </span>
      </div>
    </div>
  )
}
