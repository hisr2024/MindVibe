'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string | null
  authUid: string
  locale: string
  twoFactorEnabled: boolean
  isSuspended: boolean
  createdAt: string
}

interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // In production, fetch from API
    setTimeout(() => {
      setUsers([
        {
          id: 'user-1',
          email: 'user1@example.com',
          authUid: 'auth-123',
          locale: 'en',
          twoFactorEnabled: true,
          isSuspended: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          authUid: 'auth-456',
          locale: 'en',
          twoFactorEnabled: false,
          isSuspended: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'user-3',
          email: 'suspended@example.com',
          authUid: 'auth-789',
          locale: 'en',
          twoFactorEnabled: false,
          isSuspended: true,
          createdAt: new Date().toISOString(),
        },
      ])
      setTotal(3)
      setTotalPages(1)
      setLoading(false)
    }, 500)
  }, [page, search])

  const handleSuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return
    // In production, call API
    setUsers(users.map(u => 
      u.id === userId ? { ...u, isSuspended: true } : u
    ))
  }

  const handleReactivate = async (userId: string) => {
    // In production, call API
    setUsers(users.map(u => 
      u.id === userId ? { ...u, isSuspended: false } : u
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-sm text-slate-400">
            Search, view, and manage user accounts
          </p>
        </div>
        <div className="text-sm text-slate-400">
          {total.toLocaleString()} total users
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or ID..."
            className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2.5 text-slate-100 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <button className="rounded-lg bg-slate-700 px-4 py-2.5 text-slate-200 hover:bg-slate-600">
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                2FA
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="bg-slate-800/30 hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-200">{user.email}</p>
                      <p className="text-xs text-slate-400">{user.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        user.isSuspended
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={user.twoFactorEnabled ? 'text-green-400' : 'text-slate-400'}>
                      {user.twoFactorEnabled ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {isClient ? new Date(user.createdAt).toLocaleDateString() : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/admin/users/${user.id}`}
                        className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600"
                      >
                        View
                      </a>
                      {user.isSuspended ? (
                        <button
                          onClick={() => handleReactivate(user.id)}
                          className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/30"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(user.id)}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
