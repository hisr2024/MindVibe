'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: number
  title: string
  content: string
  type: string
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setAnnouncements([
        {
          id: 1,
          title: 'New Features Available',
          content: 'Check out our new meditation features and improved journaling!',
          type: 'banner',
          isActive: true,
          startsAt: null,
          endsAt: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Maintenance Notice',
          content: 'Scheduled maintenance on Sunday 2AM-4AM UTC.',
          type: 'modal',
          isActive: false,
          startsAt: new Date(Date.now() + 86400000).toISOString(),
          endsAt: new Date(Date.now() + 172800000).toISOString(),
          createdAt: new Date().toISOString(),
        },
      ])
      setLoading(false)
    }, 500)
  }, [])

  const typeIcons: { [key: string]: string } = {
    banner: '📢',
    modal: '🪟',
    toast: '💬',
    email: '📧',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Announcements</h1>
          <p className="text-sm text-slate-400">
            Create and manage system announcements
          </p>
        </div>
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-orange-400">
          + New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center text-slate-400">No announcements</div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{typeIcons[announcement.type]}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{announcement.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded bg-slate-600 px-2 py-0.5 text-xs capitalize text-slate-200">
                          {announcement.type}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            announcement.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-600 text-slate-400'
                          }`}
                        >
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{announcement.content}</p>
                  {(announcement.startsAt || announcement.endsAt) && (
                    <div className="mt-2 text-xs text-slate-500">
                      {announcement.startsAt && `Starts: ${new Date(announcement.startsAt).toLocaleString()}`}
                      {announcement.startsAt && announcement.endsAt && ' • '}
                      {announcement.endsAt && `Ends: ${new Date(announcement.endsAt).toLocaleString()}`}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600">
                    Edit
                  </button>
                  <button className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
