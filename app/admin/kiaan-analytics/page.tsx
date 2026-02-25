'use client'

import { useState, useEffect } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface KiaanOverview {
  totalQuestionsToday: number
  totalQuestionsWeek: number
  totalQuestionsMonth: number
  uniqueUsersToday: number
  uniqueUsersWeek: number
  uniqueUsersMonth: number
  avgResponseTimeMs: number | null
  avgSatisfaction: number | null
}

export default function AdminKiaanAnalyticsPage() {
  const [overview, setOverview] = useState<KiaanOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setOverview({
        totalQuestionsToday: 1247,
        totalQuestionsWeek: 8543,
        totalQuestionsMonth: 34521,
        uniqueUsersToday: 342,
        uniqueUsersWeek: 1856,
        uniqueUsersMonth: 4231,
        avgResponseTimeMs: 1250,
        avgSatisfaction: 4.6,
      })
      setLoading(false)
    }, 500)
  }, [])

  const weeklyData = [
    { day: 'Mon', questions: 1150, users: 320 },
    { day: 'Tue', questions: 1280, users: 355 },
    { day: 'Wed', questions: 1420, users: 380 },
    { day: 'Thu', questions: 1180, users: 340 },
    { day: 'Fri', questions: 1350, users: 365 },
    { day: 'Sat', questions: 890, users: 260 },
    { day: 'Sun', questions: 1247, users: 342 },
  ]

  const topicData = [
    { topic: 'Anxiety', count: 2456 },
    { topic: 'Stress', count: 1892 },
    { topic: 'Sleep', count: 1534 },
    { topic: 'Relationships', count: 1201 },
    { topic: 'Self-esteem', count: 987 },
    { topic: 'Work-life', count: 854 },
  ]

  const tierUsage = [
    { tier: 'Free', users: 1245, questions: 12450, avgUsage: 45 },
    { tier: 'Basic', users: 432, questions: 8640, avgUsage: 65 },
    { tier: 'Premium', users: 189, questions: 9450, avgUsage: 78 },
    { tier: 'Enterprise', users: 28, questions: 2800, avgUsage: 82 },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading KIAAN analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            <span className="mr-2">🕉️</span>
            KIAAN Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Read-only view of KIAAN usage metrics (aggregated & anonymized)
          </p>
        </div>
      </div>

      {/* KIAAN Protection Banner */}
      <div className="rounded-xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="font-medium text-[#d4a44c]">KIAAN Ecosystem Protected</p>
            <p className="text-sm text-[#e8b54a]/80">
              This dashboard provides read-only analytics. Admin cannot modify KIAAN logic, 
              access conversations, or bypass quota limits.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Questions Today</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {overview?.totalQuestionsToday.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Unique Users Today</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">
            {overview?.uniqueUsersToday.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">Avg Response Time</p>
          <p className="mt-1 text-2xl font-bold text-green-400">
            {overview?.avgResponseTimeMs ? `${(overview.avgResponseTimeMs / 1000).toFixed(1)}s` : '-'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">User Satisfaction</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">
            {overview?.avgSatisfaction ? `${overview.avgSatisfaction}/5.0` : '-'}
          </p>
        </div>
      </div>

      {/* Usage Trend Chart */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Weekly Usage Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
            />
            <Area
              type="monotone"
              dataKey="questions"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.2}
              name="Questions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Topic Distribution */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Topic Distribution (This Week)</h2>
        <p className="mb-4 text-xs text-slate-500">
          * Topics are aggregated and anonymized. No individual conversation data.
        </p>
        <div className="space-y-3">
          {topicData.map((item) => (
            <div key={item.topic} className="flex items-center gap-4">
              <span className="w-24 text-sm text-slate-300">{item.topic}</span>
              <div className="flex-1">
                <div className="h-4 rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#d4a44c] to-[#d4a44c]"
                    style={{ width: `${(item.count / topicData[0].count) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-16 text-right text-sm text-slate-400">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tier Usage */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Usage by Subscription Tier</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-400">
                <th className="pb-3 pr-4">Tier</th>
                <th className="pb-3 pr-4">Active Users</th>
                <th className="pb-3 pr-4">Total Questions</th>
                <th className="pb-3">Avg Usage %</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tierUsage.map((item) => (
                <tr key={item.tier} className="border-t border-slate-700">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-slate-200">{item.tier}</span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{item.users.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-slate-300">{item.questions.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-slate-700">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${item.avgUsage}%` }}
                        />
                      </div>
                      <span className="text-slate-400">{item.avgUsage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
