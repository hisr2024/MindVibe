'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface SubscriptionAnalytics {
  totalActive: number
  totalByTier: { [key: string]: number }
  totalByStatus: { [key: string]: number }
  newThisMonth: number
  churnedThisMonth: number
  churnRate: number
  mrr: number
}

const COLORS = ['#f97316', '#22c55e', '#8b5cf6', '#06b6d4']

export default function AdminSubscriptionsPage() {
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch from API
    setTimeout(() => {
      setAnalytics({
        totalActive: 892,
        totalByTier: {
          free: 450,
          basic: 280,
          premium: 130,
          enterprise: 32,
        },
        totalByStatus: {
          active: 892,
          past_due: 23,
          canceled: 45,
          trialing: 87,
        },
        newThisMonth: 156,
        churnedThisMonth: 12,
        churnRate: 1.34,
        mrr: 24589.00,
      })
      setLoading(false)
    }, 500)
  }, [])

  const tierData = analytics
    ? Object.entries(analytics.totalByTier).map(([name, value]) => ({ name, value }))
    : []

  const monthlyData = [
    { month: 'Jul', subscriptions: 720, revenue: 18500 },
    { month: 'Aug', subscriptions: 780, revenue: 20200 },
    { month: 'Sep', subscriptions: 820, revenue: 21800 },
    { month: 'Oct', subscriptions: 850, revenue: 23100 },
    { month: 'Nov', subscriptions: 870, revenue: 24000 },
    { month: 'Dec', subscriptions: 892, revenue: 24589 },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading subscription data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Subscription Management</h1>
        <p className="text-sm text-slate-400">
          Monitor subscriptions, revenue, and churn analytics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Active Subscriptions</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {analytics?.totalActive.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Monthly Recurring Revenue</p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            ${analytics?.mrr.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">New This Month</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">
            +{analytics?.newThisMonth}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Churn Rate</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">
            {analytics?.churnRate}%
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Distribution */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Plan Distribution</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {tierData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm capitalize text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Status Breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analytics &&
            Object.entries(analytics.totalByStatus).map(([status, count]) => (
              <div
                key={status}
                className="rounded-lg bg-slate-700/30 p-4"
              >
                <p className="text-sm capitalize text-slate-400">{status.replace('_', ' ')}</p>
                <p className="mt-1 text-xl font-bold text-slate-100">{count}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <a
          href="/admin/export?type=subscriptions"
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
        >
          Export Subscriptions
        </a>
        <a
          href="/admin/subscriptions/payments"
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
        >
          View Payments
        </a>
      </div>
    </div>
  )
}
