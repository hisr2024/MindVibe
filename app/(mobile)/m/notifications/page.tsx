'use client'

/**
 * Mobile Notifications Page
 *
 * Notification center showing wisdom reminders, journey progress alerts,
 * and system messages. Grouped by time period with swipe-to-dismiss.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellOff,
  Sparkles,
  Compass,
  BookOpen,
  Heart,
  CheckCheck,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface Notification {
  id: string
  type: 'wisdom' | 'journey' | 'insight' | 'system' | 'reminder'
  title: string
  body: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  wisdom: <BookOpen className="w-4 h-4 text-teal-400" />,
  journey: <Compass className="w-4 h-4 text-cyan-400" />,
  insight: <Sparkles className="w-4 h-4 text-orange-400" />,
  system: <Bell className="w-4 h-4 text-slate-400" />,
  reminder: <Heart className="w-4 h-4 text-pink-400" />,
}

const NOTIFICATION_BG: Record<string, string> = {
  wisdom: 'bg-teal-500/15',
  journey: 'bg-cyan-500/15',
  insight: 'bg-orange-500/15',
  system: 'bg-white/[0.06]',
  reminder: 'bg-pink-500/15',
}

export default function MobileNotificationsPage() {
  const router = useRouter()
  const { isAuthenticated: _isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load notifications from localStorage (since backend notification API may not exist)
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem('mindvibe_notifications')
        if (stored) {
          setNotifications(JSON.parse(stored))
        } else {
          // Seed with welcome notifications for new users
          const welcomeNotifications: Notification[] = [
            {
              id: 'welcome-1',
              type: 'wisdom',
              title: 'Daily Wisdom Awaits',
              body: 'A new verse from the Bhagavad Gita is ready for you. Start your day with ancient wisdom.',
              timestamp: new Date().toISOString(),
              read: false,
              actionUrl: '/m/wisdom',
            },
            {
              id: 'welcome-2',
              type: 'journey',
              title: 'Begin Your Journey',
              body: 'Explore transformational journeys designed to bring peace and clarity to your life.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              read: false,
              actionUrl: '/m/journeys',
            },
            {
              id: 'welcome-3',
              type: 'insight',
              title: 'Meet KIAAN',
              body: 'Your AI wisdom companion is ready. Share what is on your mind and receive guidance rooted in the Gita.',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              read: false,
              actionUrl: '/m/kiaan',
            },
          ]
          setNotifications(welcomeNotifications)
          localStorage.setItem('mindvibe_notifications', JSON.stringify(welcomeNotifications))
        }
      } catch {
        // Ignore localStorage errors
      }
      setIsLoading(false)
    }

    loadNotifications()
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
      localStorage.setItem('mindvibe_notifications', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    triggerHaptic('success')
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      localStorage.setItem('mindvibe_notifications', JSON.stringify(updated))
      return updated
    })
  }, [triggerHaptic])

  // Remove notification
  const _removeNotification = useCallback((id: string) => {
    triggerHaptic('light')
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem('mindvibe_notifications', JSON.stringify(updated))
      return updated
    })
  }, [triggerHaptic])

  // Handle notification tap
  const handleNotificationTap = useCallback((notification: Notification) => {
    triggerHaptic('selection')
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }, [markAsRead, router, triggerHaptic])

  // Group notifications by time
  const groupedNotifications = notifications.reduce<Record<string, Notification[]>>((groups, notification) => {
    const date = new Date(notification.timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    let group: string
    if (diffHours < 24) group = 'Today'
    else if (diffHours < 48) group = 'Yesterday'
    else group = 'Earlier'

    if (!groups[group]) groups[group] = []
    groups[group].push(notification)
    return groups
  }, {})

  const unreadCount = notifications.filter(n => !n.read).length

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <MobileAppShell
      title="Notifications"
      showBack
      onBack={() => router.back()}
      showTabBar={false}
      rightActions={
        unreadCount > 0 ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={markAllAsRead}
            className="p-2 rounded-lg text-orange-400"
            aria-label="Mark all as read"
          >
            <CheckCheck className="w-5 h-5" />
          </motion.button>
        ) : undefined
      }
    >
      <div className="pb-safe-bottom">
        {isLoading ? (
          <div className="px-4 space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <BellOff className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-slate-400 text-center">No notifications yet</p>
            <p className="text-sm text-slate-500 text-center mt-1">
              Wisdom reminders and journey updates will appear here
            </p>
          </div>
        ) : (
          <div className="px-4 space-y-6 pt-2">
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20"
              >
                <Bell className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-400 font-medium">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
              </motion.div>
            )}

            {/* Grouped notifications */}
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  {group}
                </h2>
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100, height: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleNotificationTap(notification)}
                          className={`w-full p-4 rounded-2xl text-left border border-white/[0.06] ${
                            notification.read ? 'bg-white/[0.01]' : 'bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${NOTIFICATION_BG[notification.type]}`}>
                              {NOTIFICATION_ICONS[notification.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className={`text-sm font-medium truncate ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {notification.body}
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileAppShell>
  )
}
