'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SettingsSection, SettingsItem, SettingsDivider } from '@/components/settings'
import { ThemeToggle, Button, Card, CardContent } from '@/components/ui'
import { OfflineModeToggle } from '@/components/OfflineModeToggle'

// Dynamic imports for framer-motion components to reduce bundle size
const ToggleSwitch = dynamic(() => import('@/components/settings/ToggleSwitch').then(mod => mod.ToggleSwitch), { ssr: false })
const SyncStatusWidget = dynamic(() => import('@/components/SyncStatusWidget').then(mod => mod.SyncStatusWidget), { ssr: false })

interface Settings {
  notifications: {
    email: boolean
    dailyReminder: boolean
    quotaWarning: boolean
    weeklyDigest: boolean
  }
  privacy: {
    shareAnalytics: boolean
    saveHistory: boolean
  }
  accessibility: {
    reducedMotion: boolean
    highContrast: boolean
  }
}

const SETTINGS_STORAGE_KEY = 'mindvibe_settings'

const defaultSettings: Settings = {
  notifications: {
    email: true,
    dailyReminder: false,
    quotaWarning: true,
    weeklyDigest: false,
  },
  privacy: {
    shareAnalytics: false,
    saveHistory: true,
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      setSettings(JSON.parse(stored))
    }
  }, [])

  const updateSetting = <K extends keyof Settings>(
    category: K,
    key: keyof Settings[K],
    value: boolean
  ) => {
    const updated = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    }
    setSettings(updated)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <main className="mx-auto max-w-3xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-50 mb-2">Settings</h1>
        <p className="text-orange-100/70">Customize your MindVibe experience</p>
      </div>

      {saved && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-50">
          Settings saved automatically
        </div>
      )}

      {/* Account */}
      <SettingsSection title="Account" description="Manage your account settings" className="mb-6">
        <SettingsItem label="Profile" description="Edit your name, bio, and avatar">
          <Link href="/profile">
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Subscription" description="Manage your plan and billing">
          <Link href="/dashboard/subscription">
            <Button variant="outline" size="sm">Manage</Button>
          </Link>
        </SettingsItem>
      </SettingsSection>

      {/* Security */}
      <SettingsSection title="Security" description="Protect your account with additional security measures" className="mb-6">
        <SettingsItem label="Two-Factor Authentication" description="Add an extra layer of security to your account">
          <Link href="/settings/security">
            <Button variant="outline" size="sm">Configure</Button>
          </Link>
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Active Sessions" description="Manage devices logged into your account">
          <Link href="/settings/security/sessions">
            <Button variant="outline" size="sm">View Sessions</Button>
          </Link>
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Password" description="Change your account password">
          <Link href="/settings/security">
            <Button variant="outline" size="sm">Update</Button>
          </Link>
        </SettingsItem>
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance" description="Customize how MindVibe looks" className="mb-6">
        <SettingsItem label="Theme" description="Switch between light and dark mode">
          <ThemeToggle />
        </SettingsItem>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications" description="Choose what updates you receive" className="mb-6">
        <SettingsItem label="Email Notifications" description="Receive updates via email">
          <ToggleSwitch
            enabled={settings.notifications.email}
            onToggle={(v) => updateSetting('notifications', 'email', v)}
          />
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Daily Reminder" description="Get a daily prompt to check in">
          <ToggleSwitch
            enabled={settings.notifications.dailyReminder}
            onToggle={(v) => updateSetting('notifications', 'dailyReminder', v)}
          />
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Quota Warning" description="Notify when approaching question limit">
          <ToggleSwitch
            enabled={settings.notifications.quotaWarning}
            onToggle={(v) => updateSetting('notifications', 'quotaWarning', v)}
          />
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Weekly Digest" description="Summary of your weekly activity">
          <ToggleSwitch
            enabled={settings.notifications.weeklyDigest}
            onToggle={(v) => updateSetting('notifications', 'weeklyDigest', v)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection title="Privacy" description="Control your data and privacy" className="mb-6">
        <SettingsItem label="Analytics" description="Help improve MindVibe with anonymous usage data">
          <ToggleSwitch
            enabled={settings.privacy.shareAnalytics}
            onToggle={(v) => updateSetting('privacy', 'shareAnalytics', v)}
          />
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="Save Conversation History" description="Store chat history locally for continuity">
          <ToggleSwitch
            enabled={settings.privacy.saveHistory}
            onToggle={(v) => updateSetting('privacy', 'saveHistory', v)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Accessibility */}
      <SettingsSection title="Accessibility" description="Adjust for your needs" className="mb-6">
        <SettingsItem label="Reduced Motion" description="Minimize animations">
          <ToggleSwitch
            enabled={settings.accessibility.reducedMotion}
            onToggle={(v) => updateSetting('accessibility', 'reducedMotion', v)}
          />
        </SettingsItem>
        <SettingsDivider />
        <SettingsItem label="High Contrast" description="Increase text contrast">
          <ToggleSwitch
            enabled={settings.accessibility.highContrast}
            onToggle={(v) => updateSetting('accessibility', 'highContrast', v)}
          />
        </SettingsItem>
      </SettingsSection>

      {/* Offline & Cache Management */}
      <SettingsSection title="Offline & Cache" description="Manage offline access and cached data" className="mb-6">
        <div className="space-y-4">
          <OfflineModeToggle />
          <SyncStatusWidget />
        </div>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection title="Data Management" description="Export or delete your data" className="mb-6">
        <div className="space-y-4">
          <Card variant="bordered">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-50">Export All Data</p>
                <p className="text-xs text-orange-100/50">Download your journal entries, settings, and chat history</p>
              </div>
              <Button variant="outline" size="sm">Export</Button>
            </CardContent>
          </Card>
          <Card variant="bordered">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-400">Delete All Data</p>
                <p className="text-xs text-orange-100/50">Permanently remove all your data from this device</p>
              </div>
              <Button variant="danger" size="sm">Delete</Button>
            </CardContent>
          </Card>
        </div>
      </SettingsSection>

      {/* Links */}
      <div className="text-center text-sm text-orange-100/50 flex flex-wrap justify-center gap-2 sm:gap-4">
        <Link href="/privacy" className="hover:text-orange-100">Privacy Policy</Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-orange-100">Terms of Service</Link>
        <span>•</span>
        <Link href="/contact" className="hover:text-orange-100">Contact Support</Link>
      </div>
    </main>
  )
}
