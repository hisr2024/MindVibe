'use client'

import { useState, useEffect } from 'react'

interface NotificationTimingProps {
  className?: string
}

interface TimingSettings {
  reminderTime: string
  weeklyDigestDay: string
}

const TIMING_STORAGE_KEY = 'mindvibe_notification_timing'

const daysOfWeek = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

const defaultSettings: TimingSettings = {
  reminderTime: '09:00',
  weeklyDigestDay: 'monday',
}

export function NotificationTiming({ className = '' }: NotificationTimingProps) {
  const [settings, setSettings] = useState<TimingSettings>(defaultSettings)

  useEffect(() => {
    const stored = localStorage.getItem(TIMING_STORAGE_KEY)
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        setSettings(defaultSettings)
      }
    }
  }, [])

  const updateSettings = (updates: Partial<TimingSettings>) => {
    const updated = { ...settings, ...updates }
    setSettings(updated)
    localStorage.setItem(TIMING_STORAGE_KEY, JSON.stringify(updated))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Daily Reminder Time */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-orange-500/15 bg-black/20">
        <div>
          <p className="text-sm font-medium text-orange-50">Daily Reminder Time</p>
          <p className="text-xs text-orange-100/50">When should we remind you to check in?</p>
        </div>
        <div className="relative">
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => updateSettings({ reminderTime: e.target.value })}
            className="rounded-xl border border-orange-500/30 bg-black/40 px-3 py-2 text-sm text-orange-50 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            aria-label="Daily reminder time"
          />
        </div>
      </div>

      {/* Weekly Digest Day */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-orange-500/15 bg-black/20">
        <div>
          <p className="text-sm font-medium text-orange-50">Weekly Digest Day</p>
          <p className="text-xs text-orange-100/50">When to send your weekly summary</p>
        </div>
        <select
          value={settings.weeklyDigestDay}
          onChange={(e) => updateSettings({ weeklyDigestDay: e.target.value })}
          className="rounded-xl border border-orange-500/30 bg-black/40 px-3 py-2 text-sm text-orange-50 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          aria-label="Weekly digest day"
        >
          {daysOfWeek.map((day) => (
            <option key={day.value} value={day.value} className="bg-slate-900">
              {day.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-orange-100/50">
        Notification timing preferences are stored locally. Actual notification delivery depends on browser permissions.
      </p>
    </div>
  )
}

export default NotificationTiming
