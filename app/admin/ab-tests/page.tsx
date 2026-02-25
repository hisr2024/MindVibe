'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ABTest {
  id: number
  name: string
  description: string | null
  variants: { name: string; weight: number }[]
  status: string
  trafficPercentage: number
  createdAt: string
}

export default function AdminABTestsPage() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setTests([
        {
          id: 1,
          name: 'Onboarding Flow V2',
          description: 'Testing new simplified onboarding flow',
          variants: [
            { name: 'control', weight: 50 },
            { name: 'variant_a', weight: 50 },
          ],
          status: 'running',
          trafficPercentage: 100,
          createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          id: 2,
          name: 'Pricing Page CTA',
          description: 'Testing different CTA button colors',
          variants: [
            { name: 'orange', weight: 33 },
            { name: 'green', weight: 33 },
            { name: 'blue', weight: 34 },
          ],
          status: 'running',
          trafficPercentage: 50,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 3,
          name: 'Dashboard Layout',
          description: 'Completed test for new dashboard',
          variants: [
            { name: 'current', weight: 50 },
            { name: 'redesign', weight: 50 },
          ],
          status: 'completed',
          trafficPercentage: 100,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const mockResults = [
    { variant: 'control', participants: 1250, conversions: 125, rate: 10.0 },
    { variant: 'variant_a', participants: 1245, conversions: 156, rate: 12.5 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'completed':
        return 'bg-blue-500/20 text-blue-400'
      default:
        return 'bg-slate-600 text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">A/B Tests</h1>
          <p className="text-sm text-slate-400">
            Create and manage experiments
          </p>
        </div>
        <button className="rounded-lg bg-[#d4a44c] px-4 py-2 text-sm font-medium text-slate-900 hover:bg-[#d4a44c]">
          + New Test
        </button>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading...</div>
        ) : (
          tests.map((test) => (
            <div
              key={test.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-100">{test.name}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                  </div>
                  {test.description && (
                    <p className="mt-1 text-sm text-slate-400">{test.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {test.variants.map((variant) => (
                      <span
                        key={variant.name}
                        className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300"
                      >
                        {variant.name}: {variant.weight}%
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Traffic: {test.trafficPercentage}% • Created: {new Date(test.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/admin/ab-tests/${test.id}`}
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600"
                  >
                    Results
                  </a>
                  {test.status === 'running' && (
                    <button className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/30">
                      Pause
                    </button>
                  )}
                </div>
              </div>

              {/* Results Preview for Running Tests */}
              {test.status === 'running' && test.id === 1 && (
                <div className="mt-6 rounded-lg bg-slate-700/30 p-4">
                  <h4 className="mb-3 text-sm font-medium text-slate-200">Current Results</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={mockResults}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="variant" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      />
                      <Bar dataKey="rate" fill="#d4a44c" name="Conversion Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 flex gap-4 text-xs text-slate-400">
                    <span>Winner: <strong className="text-green-400">variant_a</strong></span>
                    <span>Improvement: <strong className="text-green-400">+25%</strong></span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
