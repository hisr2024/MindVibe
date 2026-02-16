'use client'

import { useState, useEffect } from 'react'

interface FeatureFlag {
  id: number
  key: string
  name: string
  description: string | null
  enabled: boolean
  rolloutPercentage: number
  targetTiers: string[] | null
  createdAt: string
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    // In production, fetch from API
    setTimeout(() => {
      setFlags([
        {
          id: 1,
          key: 'new_dashboard',
          name: 'New Dashboard',
          description: 'Redesigned dashboard with improved analytics',
          enabled: true,
          rolloutPercentage: 50,
          targetTiers: ['premium', 'enterprise', 'premier'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          key: 'ai_suggestions',
          name: 'AI Suggestions',
          description: 'AI-powered wellness suggestions',
          enabled: false,
          rolloutPercentage: 0,
          targetTiers: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 3,
          key: 'dark_mode_v2',
          name: 'Dark Mode V2',
          description: 'Updated dark mode with better contrast',
          enabled: true,
          rolloutPercentage: 100,
          targetTiers: null,
          createdAt: new Date().toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const handleToggle = async (flagId: number, enabled: boolean) => {
    // In production, call API
    setFlags(flags.map(f => 
      f.id === flagId ? { ...f, enabled } : f
    ))
  }

  const handleRolloutChange = async (flagId: number, percentage: number) => {
    // In production, call API
    setFlags(flags.map(f => 
      f.id === flagId ? { ...f, rolloutPercentage: percentage } : f
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Feature Flags</h1>
          <p className="text-sm text-slate-400">
            Manage feature toggles and gradual rollouts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-orange-400"
        >
          + Create Flag
        </button>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading flags...</div>
        ) : flags.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No feature flags</div>
        ) : (
          flags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-100">{flag.name}</h3>
                    <code className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {flag.key}
                    </code>
                  </div>
                  {flag.description && (
                    <p className="mt-1 text-sm text-slate-400">{flag.description}</p>
                  )}
                  {flag.targetTiers && flag.targetTiers.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {flag.targetTiers.map((tier) => (
                        <span
                          key={tier}
                          className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs capitalize text-purple-400"
                        >
                          {tier}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(flag.id, !flag.enabled)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    flag.enabled ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition ${
                      flag.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Rollout Slider */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Rollout Percentage</span>
                  <span className="font-medium text-slate-200">{flag.rolloutPercentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={flag.rolloutPercentage}
                  onChange={(e) => handleRolloutChange(flag.id, parseInt(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-orange-500"
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal - Simplified */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Create Feature Flag</h2>
            <form className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400">Key</label>
                <input
                  type="text"
                  placeholder="feature_key"
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400">Name</label>
                <input
                  type="text"
                  placeholder="Feature Name"
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400">Description</label>
                <textarea
                  placeholder="What does this feature do?"
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-100"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-slate-900 hover:bg-orange-400"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
