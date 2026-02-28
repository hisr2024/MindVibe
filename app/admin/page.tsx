'use client'

import { useState, useEffect } from 'react'

interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  pendingModeration: number
  activeFeatureFlags: number
  runningTests: number
  todayLogins: number
}

interface RecentActivity {
  id: number
  action: string
  adminEmail: string
  resourceType: string
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingModeration: 0,
    activeFeatureFlags: 0,
    runningTests: 0,
    todayLogins: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch from API
    // For now, show placeholder data
    setTimeout(() => {
      setStats({
        totalUsers: 1247,
        activeSubscriptions: 892,
        pendingModeration: 12,
        activeFeatureFlags: 8,
        runningTests: 3,
        todayLogins: 156,
      })
      setRecentActivity([
        {
          id: 1,
          action: 'user_suspended',
          adminEmail: 'admin@mindvibe.life',
          resourceType: 'user',
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          action: 'feature_flag_updated',
          adminEmail: 'admin@mindvibe.life',
          resourceType: 'feature_flag',
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          action: 'announcement_created',
          adminEmail: 'moderator@mindvibe.life',
          resourceType: 'announcement',
          createdAt: new Date().toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'from-blue-500 to-blue-600' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '💳', color: 'from-green-500 to-green-600' },
    { label: 'Pending Moderation', value: stats.pendingModeration, icon: '🛡️', color: 'from-yellow-500 to-yellow-600' },
    { label: 'Active Flags', value: stats.activeFeatureFlags, icon: '🚩', color: 'from-purple-500 to-purple-600' },
    { label: 'Running Tests', value: stats.runningTests, icon: '🧪', color: 'from-pink-500 to-pink-600' },
    { label: 'Today Logins', value: stats.todayLogins, icon: '🔐', color: 'from-[#d4a44c] to-[#c8943a]' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-sm text-slate-400">
            Welcome to Sakha Enterprise Admin
          </p>
        </div>
        <div className="text-right text-sm text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-100">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}
              >
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg bg-slate-700/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-600">
                  <span className="text-sm">
                    {activity.action === 'user_suspended' && '🚫'}
                    {activity.action === 'feature_flag_updated' && '🚩'}
                    {activity.action === 'announcement_created' && '📢'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {activity.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400">by {activity.adminEmail}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {new Date(activity.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* KIAAN Protection Notice */}
      <div className="rounded-xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🕉️</span>
          <div>
            <h3 className="font-semibold text-[#d4a44c]">KIAAN Protection Active</h3>
            <p className="mt-1 text-sm text-[#e8b54a]/80">
              KIAAN ecosystem is protected. Admin access is read-only for analytics. 
              Chatbot logic, wisdom database, and encrypted conversations cannot be modified.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="/admin/users"
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-[#d4a44c]/50 hover:bg-slate-800"
        >
          <span className="text-2xl">👥</span>
          <div>
            <p className="font-medium text-slate-200">Manage Users</p>
            <p className="text-xs text-slate-400">Search, filter, suspend</p>
          </div>
        </a>
        <a
          href="/admin/moderation"
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-[#d4a44c]/50 hover:bg-slate-800"
        >
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="font-medium text-slate-200">Content Moderation</p>
            <p className="text-xs text-slate-400">{stats.pendingModeration} pending</p>
          </div>
        </a>
        <a
          href="/admin/feature-flags"
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-[#d4a44c]/50 hover:bg-slate-800"
        >
          <span className="text-2xl">🚩</span>
          <div>
            <p className="font-medium text-slate-200">Feature Flags</p>
            <p className="text-xs text-slate-400">{stats.activeFeatureFlags} active</p>
          </div>
        </a>
        <a
          href="/admin/export"
          className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition hover:border-[#d4a44c]/50 hover:bg-slate-800"
        >
          <span className="text-2xl">📤</span>
          <div>
            <p className="font-medium text-slate-200">Export Data</p>
            <p className="text-xs text-slate-400">CSV, JSON formats</p>
          </div>
        </a>
      </div>
    </div>
  )
}
