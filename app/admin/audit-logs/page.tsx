'use client'

import { useState, useEffect } from 'react'

interface AuditLogEntry {
  id: number
  adminId: string | null
  adminEmail: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  details: object | null
  ipAddress: string | null
  createdAt: string
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState<string>('')

  useEffect(() => {
    setTimeout(() => {
      setLogs([
        {
          id: 1,
          adminId: 'admin-123',
          adminEmail: 'admin@mindvibe.app',
          action: 'user_suspended',
          resourceType: 'user',
          resourceId: 'user-456',
          details: { reason: 'Violation of terms' },
          ipAddress: '192.168.1.1',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          adminId: 'admin-123',
          adminEmail: 'admin@mindvibe.app',
          action: 'feature_flag_updated',
          resourceType: 'feature_flag',
          resourceId: '1',
          details: { changes: { enabled: { old: false, new: true } } },
          ipAddress: '192.168.1.1',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          adminId: 'admin-789',
          adminEmail: 'moderator@mindvibe.app',
          action: 'content_approved',
          resourceType: 'flagged_content',
          resourceId: '5',
          details: null,
          ipAddress: '192.168.1.2',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 4,
          adminId: 'admin-123',
          adminEmail: 'admin@mindvibe.app',
          action: 'login',
          resourceType: null,
          resourceId: null,
          details: { session_id: 'sess-abc123' },
          ipAddress: '192.168.1.1',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
      ])
      setTotalPages(5)
      setLoading(false)
    }, 500)
  }, [page, actionFilter])

  const getActionColor = (action: string) => {
    if (action.includes('login')) return 'bg-blue-500/20 text-blue-400'
    if (action.includes('suspend') || action.includes('reject')) return 'bg-red-500/20 text-red-400'
    if (action.includes('created') || action.includes('approved')) return 'bg-green-500/20 text-green-400'
    if (action.includes('updated')) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-slate-600 text-slate-300'
  }

  const actionTypes = [
    'All Actions',
    'login',
    'logout',
    'user_suspended',
    'user_reactivated',
    'feature_flag_created',
    'feature_flag_updated',
    'content_approved',
    'content_rejected',
    'data_exported',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
          <p className="text-sm text-slate-400">
            All admin actions are logged for security and compliance
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-200"
        >
          {actionTypes.map((type) => (
            <option key={type} value={type === 'All Actions' ? '' : type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-200"
        />
        <input
          type="date"
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-200"
        />
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Admin
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading logs...
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="bg-slate-800/30 hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {log.adminEmail || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {log.resourceType && log.resourceId
                      ? `${log.resourceType}/${log.resourceId}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">
                    {log.ipAddress || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-4">
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Note:</strong> Audit logs are immutable and cannot be
          deleted. All admin actions are automatically recorded for security and compliance purposes.
        </p>
      </div>
    </div>
  )
}
