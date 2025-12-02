'use client'

import { useState, useEffect } from 'react'

interface FlaggedContent {
  id: number
  contentType: string
  contentId: string
  userId: string
  reason: string
  details: string | null
  status: string
  flaggedAt: string
}

export default function AdminModerationPage() {
  const [items, setItems] = useState<FlaggedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('pending')

  useEffect(() => {
    setTimeout(() => {
      setItems([
        {
          id: 1,
          contentType: 'journal',
          contentId: 'journal-123',
          userId: 'user-456',
          reason: 'Self-harm content',
          details: 'Automated flag for review',
          status: 'pending',
          flaggedAt: new Date().toISOString(),
        },
        {
          id: 2,
          contentType: 'feedback',
          contentId: 'feedback-789',
          userId: 'user-111',
          reason: 'Inappropriate language',
          details: null,
          status: 'pending',
          flaggedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [filter])

  const handleModerate = async (itemId: number, action: 'approve' | 'reject') => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, status: action === 'approve' ? 'approved' : 'rejected' } : item
    ))
  }

  const pendingCount = items.filter(i => i.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Content Moderation</h1>
          <p className="text-sm text-slate-400">
            Review and moderate flagged content
          </p>
        </div>
        <div className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-yellow-400">
          {pendingCount} pending review
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-lg px-4 py-2 text-sm capitalize ${
              filter === status
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Content Queue */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading...</div>
        ) : items.filter(i => i.status === filter).length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-slate-400">No {filter} items</p>
          </div>
        ) : (
          items
            .filter(i => i.status === filter)
            .map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-slate-600 px-2 py-0.5 text-xs capitalize text-slate-200">
                        {item.contentType}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          item.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : item.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h3 className="mt-2 font-medium text-slate-100">{item.reason}</h3>
                    {item.details && (
                      <p className="mt-1 text-sm text-slate-400">{item.details}</p>
                    )}
                    <div className="mt-2 text-xs text-slate-500">
                      User: {item.userId} • Flagged: {new Date(item.flaggedAt).toLocaleString()}
                    </div>
                  </div>

                  {item.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModerate(item.id, 'approve')}
                        className="rounded-lg bg-green-500/20 px-4 py-2 text-sm text-green-400 hover:bg-green-500/30"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleModerate(item.id, 'reject')}
                        className="rounded-lg bg-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/30"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
