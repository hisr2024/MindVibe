'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SettingsSection, SettingsItem, SettingsDivider, ToggleSwitch, LanguageSelector, DataManagement, NotificationTiming } from '@/components/settings'
import { ThemeToggle, Button, Card, CardContent, FadeIn, Badge, ProgressBar } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useKiaanQuota } from '@/hooks/useKiaanQuota'

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
    fontSize: 'small' | 'medium' | 'large'
    screenReaderOptimizations: boolean
  }
  advanced: {
    debugMode: boolean
    showApiKey: boolean
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
    fontSize: 'medium',
    screenReaderOptimizations: false,
  },
  advanced: {
    debugMode: false,
    showApiKey: false,
  },
}

const fontSizeOptions = [
  { value: 'small', label: 'Small', class: 'text-xs' },
  { value: 'medium', label: 'Medium', class: 'text-sm' },
  { value: 'large', label: 'Large', class: 'text-base' },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const { subscription } = useSubscription()
  const { used, limit, isWarning } = useKiaanQuota(subscription?.tierId)

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsed })
      } catch {
        setSettings(defaultSettings)
      }
    }
  }, [])

  const updateSetting = <K extends keyof Settings>(
    category: K,
    key: keyof Settings[K],
    value: Settings[K][keyof Settings[K]]
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

  // Mock API key for demonstration
  const mockApiKey = 'mv_live_xxxxxxxxxxxxxxxxxxxx'

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-50 mb-2">Settings</h1>
          <p className="text-orange-100/70">Customize your MindVibe experience</p>
        </div>
      </FadeIn>

      {saved && (
        <FadeIn>
          <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-50">
            Settings saved automatically
          </div>
        </FadeIn>
      )}

      {/* Subscription Quick Stats */}
      <FadeIn delay={0.05}>
        <Card variant="bordered" className="mb-6">
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-orange-50">Subscription</h3>
                <Badge variant={subscription?.tierId === 'free' ? 'default' : 'premium'}>
                  {subscription?.tierName ?? 'Free'}
                </Badge>
              </div>
              <Link href="/subscription">
                <Button variant="ghost" size="sm">Manage</Button>
              </Link>
            </div>
            {limit > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-orange-100/70">KIAAN Questions Used</span>
                  <span className="font-medium text-orange-50">{used} / {limit}</span>
                </div>
                <ProgressBar
                  value={used}
                  max={limit}
                  variant={isWarning ? 'warning' : 'default'}
                />
              </div>
            )}
            {limit === -1 && (
              <p className="text-sm text-emerald-400">✓ Unlimited KIAAN Questions</p>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Account */}
      <FadeIn delay={0.1}>
        <SettingsSection title="Account" description="Manage your account settings" className="mb-6">
          <SettingsItem label="Profile" description="Edit your name, bio, and avatar">
            <Link href="/profile">
              <Button variant="outline" size="sm">Edit Profile</Button>
            </Link>
          </SettingsItem>
          <SettingsDivider />
          <SettingsItem label="Subscription" description="Manage your plan and billing">
            <Link href="/subscription">
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </SettingsItem>
        </SettingsSection>
      </FadeIn>

      {/* Language Selection */}
      <FadeIn delay={0.15}>
        <SettingsSection title="Language" description="Choose your preferred language" className="mb-6">
          <LanguageSelector />
        </SettingsSection>
      </FadeIn>

      {/* Appearance */}
      <FadeIn delay={0.2}>
        <SettingsSection title="Appearance" description="Customize how MindVibe looks" className="mb-6">
          <SettingsItem label="Theme" description="Switch between light and dark mode">
            <ThemeToggle />
          </SettingsItem>
        </SettingsSection>
      </FadeIn>

      {/* Notifications */}
      <FadeIn delay={0.25}>
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
      </FadeIn>

      {/* Notification Timing */}
      <FadeIn delay={0.3}>
        <SettingsSection title="Notification Timing" description="Configure when to receive notifications" className="mb-6">
          <NotificationTiming />
        </SettingsSection>
      </FadeIn>

      {/* Privacy */}
      <FadeIn delay={0.35}>
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
      </FadeIn>

      {/* Accessibility */}
      <FadeIn delay={0.4}>
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
          <SettingsDivider />
          <SettingsItem label="Font Size" description="Adjust text size">
            <div className="flex gap-2">
              {fontSizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    const fontSize = option.value as Settings['accessibility']['fontSize']
                    updateSetting('accessibility', 'fontSize', fontSize)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    settings.accessibility.fontSize === option.value
                      ? 'bg-orange-500/20 text-orange-50 border border-orange-400'
                      : 'bg-black/30 text-orange-100/70 border border-orange-500/15 hover:bg-orange-500/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </SettingsItem>
          <SettingsDivider />
          <SettingsItem label="Screen Reader Optimizations" description="Enhanced screen reader support">
            <ToggleSwitch
              enabled={settings.accessibility.screenReaderOptimizations}
              onToggle={(v) => updateSetting('accessibility', 'screenReaderOptimizations', v)}
            />
          </SettingsItem>
          <SettingsDivider />
          <div className="py-3">
            <p className="text-sm font-medium text-orange-50 mb-2">Keyboard Shortcuts</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-orange-100/70">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-black/40 border border-orange-500/20">Esc</kbd>
                <span>Close modals</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-black/40 border border-orange-500/20">Tab</kbd>
                <span>Navigate elements</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-black/40 border border-orange-500/20">Enter</kbd>
                <span>Activate buttons</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-black/40 border border-orange-500/20">Space</kbd>
                <span>Toggle switches</span>
              </div>
            </div>
          </div>
        </SettingsSection>
      </FadeIn>

      {/* Data Management */}
      <FadeIn delay={0.45}>
        <SettingsSection title="Data Management" description="Export or delete your data" className="mb-6">
          <DataManagement />
        </SettingsSection>
      </FadeIn>

      {/* Advanced */}
      <FadeIn delay={0.5}>
        <SettingsSection title="Advanced" description="Developer and debug options" className="mb-6">
          <SettingsItem label="Debug Mode" description="Show additional debugging information">
            <ToggleSwitch
              enabled={settings.advanced.debugMode}
              onToggle={(v) => updateSetting('advanced', 'debugMode', v)}
            />
          </SettingsItem>
          <SettingsDivider />
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-orange-50">API Key</p>
                <p className="text-xs text-orange-100/50">For future integrations (Premium only)</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSetting('advanced', 'showApiKey', !settings.advanced.showApiKey)}
              >
                {settings.advanced.showApiKey ? 'Hide' : 'Show'}
              </Button>
            </div>
            {settings.advanced.showApiKey && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-orange-500/15">
                <code className="text-xs text-orange-100/80 flex-1 font-mono">
                  {subscription?.tierId !== 'free' ? mockApiKey : 'Upgrade to access API'}
                </code>
                {subscription?.tierId !== 'free' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(mockApiKey)}
                  >
                    Copy
                  </Button>
                )}
              </div>
            )}
          </div>
          <SettingsDivider />
          <div className="py-3">
            <p className="text-sm font-medium text-orange-50 mb-2">Active Sessions</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-orange-50">Current Device</p>
                    <p className="text-xs text-orange-100/50">Active now</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
            </div>
          </div>
        </SettingsSection>
      </FadeIn>

      {/* Links */}
      <FadeIn delay={0.55}>
        <div className="text-center text-sm text-orange-100/50 space-x-4">
          <Link href="/privacy" className="hover:text-orange-100">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-orange-100">Terms of Service</Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-orange-100">Contact Support</Link>
        </div>
      </FadeIn>
    </main>
  )
}
