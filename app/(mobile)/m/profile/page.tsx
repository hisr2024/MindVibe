'use client'

/**
 * Mobile Profile Page
 *
 * User profile with account info, subscription status, and quick links
 * to settings and tools. Touch-optimized for mobile devices.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Crown,
  BookOpen,
  PenLine,
  Sparkles,
  ChevronRight,
  LogOut,
  Shield,
  TrendingUp,
  Calendar,
  Zap,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'

interface ProfileStats {
  journeysCompleted: number
  journalEntries: number
  insightsReceived: number
  dayStreak: number
  memberSince: string
}

export default function MobileProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [stats, setStats] = useState<ProfileStats>({
    journeysCompleted: 0,
    journalEntries: 0,
    insightsReceived: 0,
    dayStreak: 0,
    memberSince: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return

      try {
        const response = await apiFetch('/api/analytics/dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats({
            journeysCompleted: data.journeys_completed || 0,
            journalEntries: data.journal_entries || 0,
            insightsReceived: data.insights_count || 0,
            dayStreak: data.streak || 0,
            memberSince: data.member_since || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch profile stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [isAuthenticated])

  const handleLogout = useCallback(async () => {
    triggerHaptic('medium')
    try {
      await logout()
    } catch {
      // Ensure redirect happens even if logout API fails
    }
    router.push('/account')
  }, [logout, router, triggerHaptic])

  const handleNavigate = useCallback((href: string) => {
    triggerHaptic('selection')
    router.push(href)
  }, [router, triggerHaptic])

  const userName = user?.name || user?.email?.split('@')[0] || 'Friend'
  const userInitial = userName.charAt(0).toUpperCase()

  const STAT_ITEMS = [
    { label: 'Streak', value: stats.dayStreak, icon: Zap, color: 'text-[#d4a44c]' },
    { label: 'Journeys', value: stats.journeysCompleted, icon: TrendingUp, color: 'text-cyan-400' },
    { label: 'Reflections', value: stats.journalEntries, icon: PenLine, color: 'text-purple-400' },
    { label: 'Insights', value: stats.insightsReceived, icon: Sparkles, color: 'text-teal-400' },
  ]

  const MENU_ITEMS = [
    { label: 'Account', description: 'Security, sessions & data', icon: Shield, href: '/account' },
    { label: 'Settings', description: 'Preferences & notifications', icon: Settings, href: '/m/settings' },
    { label: 'My Journeys', description: 'View all journeys', icon: BookOpen, href: '/m/journeys' },
    { label: 'Journal History', description: 'Past reflections', icon: PenLine, href: '/m/journal' },
  ]

  if (authLoading) {
    return (
      <MobileAppShell title="Profile" showHeader={false} showTabBar={true}>
        <div className="px-4 pt-6 pb-8 space-y-6 animate-pulse">
          <div className="flex flex-col items-center pt-4">
            <div className="w-20 h-20 rounded-full bg-white/[0.06]" />
            <div className="h-5 w-32 rounded bg-white/[0.06] mt-3" />
            <div className="h-4 w-48 rounded bg-white/[0.04] mt-2" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-white/[0.03]" />)}
          </div>
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title="Profile"
      showHeader={false}
      showTabBar={true}
    >
      <div className="px-4 pt-2 pb-8 space-y-6">
        {/* Profile Header */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-safe-top pt-4"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d4a44c] to-[#d4a44c] flex items-center justify-center mb-3 shadow-lg shadow-[#d4a44c]/20">
            <span className="text-3xl font-bold text-white">{userInitial}</span>
          </div>
          <h1 className="text-xl font-bold text-white">{userName}</h1>
          {user?.email && (
            <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
          )}
          {stats.memberSince && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>Member since {new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          )}
        </motion.section>

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          {STAT_ITEMS.map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-xl text-center bg-white/[0.03] border border-white/[0.06]"
            >
              <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
              <p className={`text-lg font-bold ${stat.color}`}>
                {isLoading ? '-' : stat.value}
              </p>
              <p className="text-[9px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.section>

        {/* Subscription Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigate('/pricing')}
            className="w-full p-4 rounded-2xl text-left bg-gradient-to-r from-[#d4a44c]/15 via-[#d4a44c]/15 to-pink-500/15 border border-[#d4a44c]/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4a44c]/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[#d4a44c]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Upgrade to Premium</p>
                <p className="text-xs text-slate-400 mt-0.5">Unlock all journeys and unlimited KIAAN insights</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </div>
          </motion.button>
        </motion.section>

        {/* Menu Items */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden"
        >
          {MENU_ITEMS.map((item, index) => (
            <motion.button
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${
                index < MENU_ITEMS.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                <item.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </motion.button>
          ))}
        </motion.section>

        {/* Logout */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              triggerHaptic('medium')
              setShowLogoutConfirm(true)
            }}
            className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#d4a44c] font-medium text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </motion.button>
        </motion.section>

        {/* App version */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-600">Sakha v2.0.0</p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogoutConfirm(false)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm p-6 rounded-2xl bg-[#1a1a1f] border border-white/[0.08]"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#d4a44c]/10 flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-6 h-6 text-[#d4a44c]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Log Out?</h3>
              <p className="text-sm text-slate-400 mt-1">
                You&apos;ll need to sign in again to access your account.
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-[#d4a44c] text-white font-medium"
              >
                Log Out
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </MobileAppShell>
  )
}
