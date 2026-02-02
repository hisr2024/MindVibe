'use client'

/**
 * Mobile Settings Page
 *
 * Security-focused settings page for mobile app configuration.
 *
 * Features:
 * - Biometric authentication setup
 * - Push notification preferences
 * - Privacy controls
 * - Data export/deletion
 * - Theme and language settings
 * - Account management
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  User,
  Shield,
  Bell,
  Moon,
  Globe,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  AlertTriangle,
  Smartphone,
  Wifi,
  WifiOff,
  HelpCircle,
  Mail,
  Key,
  RefreshCw,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useBiometricAuth } from '@/hooks/useBiometricAuth'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { pushService, NotificationTopic } from '@/lib/notifications/pushService'
import { apiFetch } from '@/lib/api'

// Setting section component
interface SettingSectionProps {
  title: string
  children: React.ReactNode
}

function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider px-4 mb-2">
        {title}
      </h2>
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.06] overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Setting row component
interface SettingRowProps {
  icon: React.ReactNode
  label: string
  value?: string
  description?: string
  onClick?: () => void
  rightElement?: React.ReactNode
  danger?: boolean
  disabled?: boolean
}

function SettingRow({
  icon,
  label,
  value,
  description,
  onClick,
  rightElement,
  danger = false,
  disabled = false,
}: SettingRowProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (!disabled && onClick) {
          triggerHaptic('selection')
          onClick()
        }
      }}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-b-0 ${disabled ? 'opacity-50' : ''} ${danger ? 'text-red-400' : 'text-white'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${danger ? 'bg-red-500/10' : 'bg-white/[0.06]'}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white'}`}>
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {rightElement || (
        <>
          {value && <span className="text-sm text-slate-400">{value}</span>}
          {onClick && <ChevronRight className="w-4 h-4 text-slate-500" />}
        </>
      )}
    </motion.button>
  )
}

// Toggle switch component
interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled = false }: ToggleSwitchProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <button
      onClick={() => {
        if (!disabled) {
          triggerHaptic('selection')
          onChange(!enabled)
        }
      }}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-orange-500' : 'bg-white/[0.1]'} ${disabled ? 'opacity-50' : ''}`}
    >
      <motion.div
        animate={{ x: enabled ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
      />
    </button>
  )
}

export default function MobileSettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { triggerHaptic } = useHapticFeedback()
  const { isOnline } = useNetworkStatus()

  const {
    isAvailable: biometricAvailable,
    isRegistered: biometricEnabled,
    register: registerBiometric,
    unregister: unregisterBiometric,
    isLoading: biometricLoading,
  } = useBiometricAuth()

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationTopics, setNotificationTopics] = useState<NotificationTopic[]>([])
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState('en')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load settings
  useEffect(() => {
    const state = pushService.getState()
    setNotificationsEnabled(state.preferences.enabled)
    setNotificationTopics(state.preferences.topics)

    // Subscribe to push state changes
    const unsubscribe = pushService.onStateChange((newState) => {
      setNotificationsEnabled(newState.preferences.enabled)
      setNotificationTopics(newState.preferences.topics)
    })

    return unsubscribe
  }, [])

  // Handle biometric toggle
  const handleBiometricToggle = useCallback(async () => {
    if (biometricEnabled) {
      await unregisterBiometric()
    } else if (user) {
      await registerBiometric(user.id, user.email)
    }
  }, [biometricEnabled, registerBiometric, unregisterBiometric, user])

  // Handle notifications toggle
  const handleNotificationsToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const success = await pushService.subscribe()
      if (!success) {
        triggerHaptic('error')
      }
    } else {
      await pushService.unsubscribe()
    }
  }, [triggerHaptic])

  // Handle data export (GDPR compliant)
  const handleExportData = useCallback(async () => {
    setIsExporting(true)
    triggerHaptic('medium')

    try {
      // Request data export - backend returns a token for download
      const response = await apiFetch('/api/gdpr/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      })

      if (response.ok) {
        const data = await response.json()
        // If the response includes a download URL or token, use it
        if (data.download_url) {
          window.location.href = data.download_url
        } else if (data.token) {
          // Fetch the actual data using the token
          const downloadResponse = await apiFetch(`/api/gdpr/data-export/${data.token}`)
          if (downloadResponse.ok) {
            const exportData = await downloadResponse.json()
            const blob = new Blob([JSON.stringify(exportData.data || exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mindvibe-data-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
          }
        }
        triggerHaptic('success')
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export failed:', error)
      triggerHaptic('error')
    } finally {
      setIsExporting(false)
    }
  }, [triggerHaptic])

  // Handle account deletion (GDPR compliant)
  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true)
    triggerHaptic('heavy')

    try {
      // Use GDPR delete-account endpoint
      const response = await apiFetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })

      if (response.ok) {
        await logout()
        router.push('/')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Deletion failed')
      }
    } catch (error) {
      console.error('Deletion failed:', error)
      triggerHaptic('error')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }, [logout, router, triggerHaptic])

  // Handle logout
  const handleLogout = useCallback(async () => {
    triggerHaptic('medium')
    await logout()
    router.push('/login')
  }, [logout, router, triggerHaptic])

  return (
    <MobileAppShell
      title="Settings"
      showBack
      onBack={() => router.back()}
      showTabBar={false}
    >
      <div className="px-4 py-4 pb-safe">
        {/* Profile Section */}
        <SettingSection title="Account">
          <SettingRow
            icon={<User className="w-4 h-4 text-slate-400" />}
            label={user?.name || user?.email?.split('@')[0] || 'User'}
            description={user?.email}
            onClick={() => router.push('/m/settings/profile')}
          />
          <SettingRow
            icon={<Mail className="w-4 h-4 text-slate-400" />}
            label="Email Preferences"
            onClick={() => router.push('/m/settings/email')}
          />
          <SettingRow
            icon={<Key className="w-4 h-4 text-slate-400" />}
            label="Change Password"
            onClick={() => router.push('/m/settings/password')}
          />
        </SettingSection>

        {/* Security Section */}
        <SettingSection title="Security">
          <SettingRow
            icon={<Fingerprint className="w-4 h-4 text-slate-400" />}
            label="Biometric Authentication"
            description={biometricAvailable ? 'Use Face ID or fingerprint' : 'Not available on this device'}
            disabled={!biometricAvailable || biometricLoading}
            rightElement={
              <ToggleSwitch
                enabled={biometricEnabled}
                onChange={handleBiometricToggle}
                disabled={!biometricAvailable || biometricLoading}
              />
            }
          />
          <SettingRow
            icon={<Shield className="w-4 h-4 text-slate-400" />}
            label="Two-Factor Authentication"
            description="Add extra security to your account"
            onClick={() => router.push('/m/settings/2fa')}
          />
          <SettingRow
            icon={<Lock className="w-4 h-4 text-slate-400" />}
            label="Privacy Settings"
            onClick={() => router.push('/m/settings/privacy')}
          />
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection title="Notifications">
          <SettingRow
            icon={<Bell className="w-4 h-4 text-slate-400" />}
            label="Push Notifications"
            description="Reminders and updates"
            rightElement={
              <ToggleSwitch
                enabled={notificationsEnabled}
                onChange={handleNotificationsToggle}
              />
            }
          />
          {notificationsEnabled && (
            <SettingRow
              icon={<RefreshCw className="w-4 h-4 text-slate-400" />}
              label="Notification Types"
              value={`${notificationTopics.length} active`}
              onClick={() => router.push('/m/settings/notifications')}
            />
          )}
        </SettingSection>

        {/* App Settings */}
        <SettingSection title="App">
          <SettingRow
            icon={<Globe className="w-4 h-4 text-slate-400" />}
            label="Language"
            value={language === 'en' ? 'English' : language}
            onClick={() => router.push('/m/settings/language')}
          />
          <SettingRow
            icon={<Smartphone className="w-4 h-4 text-slate-400" />}
            label="Offline Mode"
            description={isOnline ? 'Connected' : 'Offline'}
            rightElement={
              isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-orange-400" />
              )
            }
          />
        </SettingSection>

        {/* Data & Privacy */}
        <SettingSection title="Data & Privacy">
          <SettingRow
            icon={<Download className="w-4 h-4 text-slate-400" />}
            label="Export My Data"
            description="Download all your data"
            onClick={handleExportData}
            disabled={isExporting}
            rightElement={
              isExporting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </motion.div>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )
            }
          />
          <SettingRow
            icon={<Eye className="w-4 h-4 text-slate-400" />}
            label="Privacy Policy"
            onClick={() => router.push('/privacy')}
          />
          <SettingRow
            icon={<HelpCircle className="w-4 h-4 text-slate-400" />}
            label="Help & Support"
            onClick={() => router.push('/help')}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Danger Zone">
          <SettingRow
            icon={<LogOut className="w-4 h-4 text-orange-400" />}
            label="Log Out"
            onClick={() => setShowLogoutConfirm(true)}
          />
          <SettingRow
            icon={<Trash2 className="w-4 h-4 text-red-400" />}
            label="Delete Account"
            description="Permanently delete your account and data"
            onClick={() => setShowDeleteConfirm(true)}
            danger
          />
        </SettingSection>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-600">MindVibe v2.0.0</p>
          <p className="text-xs text-slate-700">Made with love for your wellbeing</p>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AnimatePresence>
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
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
                  <LogOut className="w-6 h-6 text-orange-400" />
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
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-medium"
                >
                  Log Out
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm p-6 rounded-2xl bg-[#1a1a1f] border border-red-500/20"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Delete Account?</h3>
                <p className="text-sm text-slate-400 mt-1">
                  This action cannot be undone. All your data, including journals,
                  journey progress, and insights will be permanently deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white font-medium disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Forever</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MobileAppShell>
  )
}
