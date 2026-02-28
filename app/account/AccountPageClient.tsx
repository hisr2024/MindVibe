'use client'

import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { apiFetch } from '@/lib/api'
import { WakeWordSettings } from '@/components/wake-word/WakeWordSettings'
import { getKiaanTools } from '@/lib/api/kiaan-ecosystem'

type LegacyAccount = {
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

type Status = { type: 'success' | 'error' | 'info'; message: string }

const LEGACY_ACCOUNT_STORAGE_KEY = 'mindvibe_accounts_v2'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString))
}

/* Reusable chevron icon */
function ChevronRight({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-[#f5f0e8]/30 group-hover:text-[#e8b54a] transition shrink-0 ${className}`}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

/* Reusable section wrapper */
function AccountSection({
  icon,
  title,
  subtitle,
  children,
  borderColor = 'border-[#d4a44c]/15',
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
  borderColor?: string
}) {
  return (
    <div className={`rounded-3xl border ${borderColor} bg-black/40 p-5 sm:p-6 mb-6`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-[#d4a44c]/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#f5f0e8]">{title}</h2>
          {subtitle && <p className="text-xs text-[#f5f0e8]/50">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

/* Reusable nav row (link or button) */
function NavRow({
  href,
  onClick,
  label,
  description,
  disabled,
  trailingIcon,
  isLast,
  labelClass = 'text-[#f5f0e8] group-hover:text-[#e8b54a]',
}: {
  href?: string
  onClick?: () => void
  label: string
  description: string
  disabled?: boolean
  trailingIcon?: React.ReactNode
  isLast?: boolean
  labelClass?: string
}) {
  const inner = (
    <>
      <div className="text-left">
        <p className={`text-sm font-medium transition ${labelClass}`}>{label}</p>
        <p className="text-xs text-[#f5f0e8]/50 mt-0.5">{description}</p>
      </div>
      {trailingIcon ?? <ChevronRight />}
    </>
  )

  const cls = `w-full flex items-center justify-between py-3 px-1 group ${isLast ? '' : 'border-b border-[#d4a44c]/10'} disabled:opacity-50`

  if (href) {
    return <Link href={href} className={cls}>{inner}</Link>
  }
  return <button onClick={onClick} disabled={disabled} className={cls}>{inner}</button>
}

/* ------------------------------------------------------------------ */
/*  Authenticated Account Dashboard                                    */
/* ------------------------------------------------------------------ */
function AuthenticatedAccountView({
  user,
  onSignOut,
  isSubmitting,
}: {
  user: { id: string; email: string; name?: string }
  onSignOut: () => void
  isSubmitting: boolean
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionStatus, setActionStatus] = useState<Status | null>(null)
  const { logout } = useAuth()
  const { subscription } = useSubscription()
  const { tier, isPaid, kiaanQuota, isKiaanUnlimited, journeyLimit, isDeveloper } = useFeatureAccess()

  const kiaanTools = useMemo(() => getKiaanTools(), [])

  const handleExportData = useCallback(async () => {
    setIsExporting(true)
    setActionStatus(null)
    try {
      const response = await apiFetch('/api/gdpr/data-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json' }),
      })

      if (response.ok) {
        const data = await response.json()
        const token = data.download_token || data.token
        if (token) {
          const downloadResponse = await apiFetch(`/api/gdpr/data-export/${token}`)
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
        setActionStatus({ type: 'success', message: 'Data exported successfully.' })
      } else {
        throw new Error('Export request failed')
      }
    } catch {
      setActionStatus({ type: 'error', message: 'Failed to export data. Please try again.' })
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true)
    setActionStatus(null)
    try {
      const response = await apiFetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      if (response.ok) {
        await logout()
        window.location.href = '/'
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Account deletion failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account.'
      setActionStatus({ type: 'error', message })
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }, [logout])

  const userName = user.name || user.email.split('@')[0]
  const userInitial = userName.charAt(0).toUpperCase()

  const tierDisplayName = subscription?.tierName ?? 'Free'
  const tierColors: Record<string, string> = {
    free: 'border-[#d4a44c]/30 bg-[#d4a44c]/10 text-[#e8b54a]',
    basic: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
    premium: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
    enterprise: 'border-[#d4a44c]/30 bg-[#d4a44c]/10 text-[#e8b54a]',
    premier: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  }
  const tierBadgeClass = tierColors[tier] || tierColors.free

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f0e8] mb-1">Account</h1>
        <p className="text-sm text-[#f5f0e8]/60">Manage your account settings, security, and data</p>
      </div>

      {actionStatus && (
        <div
          className={`mb-6 rounded-2xl border p-4 text-sm ${
            actionStatus.type === 'success'
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50'
              : 'border-[#d4a44c]/40 bg-[#d4a44c]/10 text-[#f5f0e8]'
          }`}
        >
          {actionStatus.message}
        </div>
      )}

      {/* Account Overview + Subscription Card */}
      <div className="rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#0f0a08] via-[#0b0b0f] to-[#0c0f19] p-6 mb-6 shadow-[0_24px_100px_rgba(255,115,39,0.12)]">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] flex items-center justify-center text-xl font-bold text-slate-900 shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-[#f5f0e8] truncate">{userName}</p>
            <p className="text-sm text-[#f5f0e8]/60 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tierBadgeClass}`}>
              {isDeveloper ? 'Developer' : tierDisplayName}
            </span>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-50">Active</span>
            </div>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-[#d4a44c]/10">
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-xs text-[#f5f0e8]/50 mb-1">KIAAN Quota</p>
            <p className="text-sm font-semibold text-[#f5f0e8]">
              {isKiaanUnlimited ? 'Unlimited' : `${kiaanQuota}/month`}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3">
            <p className="text-xs text-[#f5f0e8]/50 mb-1">Journey Limit</p>
            <p className="text-sm font-semibold text-[#f5f0e8]">
              {journeyLimit === -1 ? 'Unlimited' : `${journeyLimit} active`}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.03] p-3 col-span-2 sm:col-span-1">
            <p className="text-xs text-[#f5f0e8]/50 mb-1">Plan</p>
            <Link href="/dashboard/subscription" className="text-sm font-semibold text-[#e8b54a] hover:text-[#e8b54a] transition">
              {isPaid ? `${tierDisplayName} Plan` : 'Free Plan'} &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* KIAAN AI Ecosystem */}
      <AccountSection
        icon={<span className="text-base font-black text-[#d4a44c]">K</span>}
        title="KIAAN AI Ecosystem"
        subtitle={`${kiaanTools.length} tools powered by Ancient Wisdom`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {kiaanTools.slice(0, 8).map(tool => (
            <Link
              key={tool.id}
              href={tool.route}
              className="group rounded-xl border border-[#d4a44c]/10 bg-white/[0.02] p-3 text-center hover:border-[#d4a44c]/30 hover:bg-[#d4a44c]/5 transition"
            >
              <span className="text-lg block mb-1">{tool.icon}</span>
              <span className="text-xs font-medium text-[#f5f0e8]/70 group-hover:text-[#f5f0e8] transition line-clamp-1">{tool.name}</span>
            </Link>
          ))}
        </div>
        <div className="space-y-1">
          <NavRow href="/kiaan/chat" label="Open KIAAN Chat" description="Your AI wisdom companion" isLast />
        </div>
      </AccountSection>

      {/* Subscription Management */}
      <AccountSection
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        }
        title="Subscription"
        subtitle={isPaid ? `${tierDisplayName} plan active` : 'Free plan'}
      >
        <div className="space-y-1">
          <NavRow
            href="/dashboard/subscription"
            label="Manage Subscription"
            description={isPaid ? `Currently on ${tierDisplayName}. View billing, upgrade, or cancel.` : 'View plans and upgrade for more KIAAN questions and features'}
          />
          {!isPaid && (
            <NavRow
              href="/pricing"
              label="Upgrade to Premium"
              description="Unlock voice companion, soul reading, unlimited journeys, and more"
              isLast
            />
          )}
          {isPaid && subscription?.cancelAtPeriodEnd && (
            <div className="mt-3 rounded-xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 p-3 text-xs text-[#f5f0e8]">
              Your plan will end on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of the billing period'}. Renew to keep your features.
            </div>
          )}
        </div>
      </AccountSection>

      {/* Security */}
      <AccountSection
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
        title="Security"
      >
        <div className="space-y-1">
          <NavRow href="/settings/security" label="Two-Factor Authentication" description="Add an extra layer of security to your account" />
          <NavRow href="/settings/security/sessions" label="Active Sessions" description="Manage devices logged into your account" />
          <NavRow href="/settings/security" label="Change Password" description="Update your account password" isLast />
        </div>
      </AccountSection>

      {/* KIAAN Voice Settings */}
      <AccountSection
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        }
        title="KIAAN Voice"
        subtitle="Wake up KIAAN with your voice from anywhere"
      >
        <WakeWordSettings />
      </AccountSection>

      {/* Data Management */}
      <AccountSection
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        }
        title="Data Management"
      >
        <div className="space-y-1">
          <NavRow
            onClick={handleExportData}
            disabled={isExporting}
            label="Export My Data"
            description="Download all your journal entries, journeys, and settings"
            trailingIcon={
              isExporting
                ? <div className="h-4 w-4 border-2 border-[#d4a44c] border-t-transparent rounded-full animate-spin shrink-0" />
                : <ChevronRight />
            }
          />
          <NavRow href="/settings" label="App Settings" description="Notifications, privacy, accessibility, and cache" isLast />
        </div>
      </AccountSection>

      {/* Quick Links */}
      <AccountSection
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        }
        title="Quick Links"
      >
        <div className="space-y-1">
          <NavRow href="/profile" label="Edit Profile" description="Update your name, bio, and avatar" />
          <NavRow href="/dashboard" label="Dashboard" description="View your journey progress and insights" />
          <NavRow href="/journeys" label="Wisdom Journeys" description="Explore guided spiritual growth paths" isLast />
        </div>
      </AccountSection>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-red-500/15 bg-black/40 p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-red-400">Danger Zone</h2>
        </div>
        <div className="space-y-1">
          <button
            onClick={onSignOut}
            disabled={isSubmitting}
            className="w-full flex items-center justify-between py-3 px-1 group border-b border-red-500/10 disabled:opacity-50"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-[#f5f0e8] group-hover:text-[#e8b54a] transition">Sign Out</p>
              <p className="text-xs text-[#f5f0e8]/50 mt-0.5">Sign out of your current session</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f5f0e8]/30 group-hover:text-[#e8b54a] transition shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between py-3 px-1 group"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-red-400 group-hover:text-red-300 transition">Delete Account</p>
              <p className="text-xs text-[#f5f0e8]/50 mt-0.5">Permanently delete your account and all data</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400/50 group-hover:text-red-300 transition shrink-0">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm p-6 rounded-2xl bg-[#1a1a1f] border border-red-500/20">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Delete Account?</h3>
              <p className="text-sm text-slate-400 mt-1">
                This action cannot be undone. All your data, including journals, journey progress, and insights will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] text-white font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Forever</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}

/* ------------------------------------------------------------------ */
/*  Unauthenticated Account View (Login / Signup)                      */
/* ------------------------------------------------------------------ */
function UnauthenticatedAccountView() {
  const { login, signup, error: authError } = useAuth()

  const [mode, setMode] = useState<'create' | 'login'>('create')
  const [legacyAccounts, setLegacyAccounts] = useState<LegacyAccount[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  })

  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(LEGACY_ACCOUNT_STORAGE_KEY)
    if (stored) {
      try {
        setLegacyAccounts(JSON.parse(stored))
      } catch {
        // Corrupted data, ignore
      }
    }
  }, [])

  useEffect(() => {
    if (authError) {
      setStatus({ type: 'error', message: authError })
    }
  }, [authError])

  const passwordStrength = useMemo(() => {
    const requirements = [
      /.{8,}/,
      /[A-Z]/,
      /[a-z]/,
      /[0-9]/,
      /[^A-Za-z0-9]/,
    ]
    const fulfilled = requirements.filter(rule => rule.test(createForm.password)).length
    const levels = ['Fragile', 'Getting there', 'Ready', 'Strong', 'Elite', 'Elite']
    const colors = ['bg-[#d4a44c]/50', 'bg-[#d4a44c]/70', 'bg-[#d4a44c]/80', 'bg-emerald-400/80', 'bg-teal-300/80', 'bg-teal-200']

    return {
      label: levels[Math.min(fulfilled, levels.length - 1)],
      percent: Math.max(16, Math.round((fulfilled / requirements.length) * 100)),
      bar: colors[Math.min(fulfilled, colors.length - 1)],
    }
  }, [createForm.password])

  const resetStatus = () => setStatus(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    resetStatus()

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setStatus({ type: 'error', message: 'Add your name, email, and a strong password to continue.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      setStatus({ type: 'error', message: 'Use a valid email address so we can keep things in sync.' })
      return
    }

    if (createForm.password.length < 8) {
      setStatus({ type: 'error', message: 'Use at least 8 characters with a mix of cases, numbers, and symbols.' })
      return
    }

    setIsSubmitting(true)

    try {
      const authUser = await signup(createForm.email.trim(), createForm.password, createForm.name.trim())

      try {
        await apiFetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: createForm.name.trim(),
            base_experience: 'new_user',
          }),
        })
      } catch (profileError) {
        console.warn('Profile creation failed:', profileError)
      }

      setStatus({ type: 'success', message: 'Account created successfully! You are now signed in.' })
      setCreateForm({ name: '', email: '', password: '' })
      setLoginForm({ email: authUser.email, password: '', twoFactorCode: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.'
      setStatus({ type: 'error', message })

      if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists')) {
        setMode('login')
        setLoginForm(prev => ({ ...prev, email: createForm.email.trim().toLowerCase() }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    resetStatus()

    if (!loginForm.email.trim() || !loginForm.password) {
      setStatus({ type: 'error', message: 'Enter your email and password to sign in.' })
      return
    }

    setIsSubmitting(true)

    try {
      await login(loginForm.email.trim(), loginForm.password, loginForm.twoFactorCode || undefined)

      setStatus({ type: 'success', message: 'Signed in successfully! Your journey awaits.' })
      setLoginForm({ email: '', password: '', twoFactorCode: '' })
      setNeedsTwoFactor(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'

      if (message.toLowerCase().includes('two-factor') || message.toLowerCase().includes('2fa')) {
        setNeedsTwoFactor(true)
        setStatus({ type: 'info', message: 'Enter your two-factor authentication code.' })
      } else {
        setStatus({ type: 'error', message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const kiaanTools = useMemo(() => getKiaanTools(), [])

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-6 sm:pt-8 md:pt-12">
      {/* Hero Section */}
      <section className="rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-br from-[#0f0a08] via-[#0b0b0f] to-[#0c0f19] p-8 shadow-[0_24px_100px_rgba(255,115,39,0.18)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-[#f5f0e8]/75">Account Access</p>
          <h1 className="text-3xl font-bold text-[#f5f0e8]">Welcome to Sakha</h1>
          <p className="text-sm text-[#f5f0e8]/60">Create an account or sign in to sync your spiritual journey across devices</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        {/* Left Column - KIAAN Ecosystem Preview + Info */}
        <div className="space-y-4">
          {/* Session Status */}
          <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/40 p-5 text-sm text-[#f5f0e8]/80">
            <p className="font-semibold text-[#f5f0e8]">No active session</p>
            <p className="mt-1">Create an account or log in to unlock your personalized spiritual flows.</p>
          </div>

          {/* KIAAN Ecosystem Preview */}
          <div className="rounded-3xl border border-[#d4a44c]/15 bg-black/40 p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a44c]/10 text-base font-black text-[#d4a44c]">K</span>
              <div>
                <p className="text-sm font-semibold text-[#f5f0e8]">KIAAN AI Ecosystem</p>
                <p className="text-xs text-[#f5f0e8]/50">{kiaanTools.length} wisdom-powered tools await you</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {kiaanTools.slice(0, 8).map(tool => (
                <div
                  key={tool.id}
                  className="rounded-xl border border-[#d4a44c]/10 bg-white/[0.02] p-2 text-center opacity-60"
                >
                  <span className="text-lg block">{tool.icon}</span>
                  <span className="text-[10px] text-[#f5f0e8]/50 line-clamp-1">{tool.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#f5f0e8]/40 mt-3 text-center">Sign in to access all tools</p>
          </div>

          {/* Legacy accounts */}
          {legacyAccounts.length > 0 && (
            <div className="rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-5 text-sm text-[#f5f0e8]/80">
              <p className="text-xs uppercase tracking-[0.18em] text-[#f5f0e8]/60">Previous local accounts</p>
              <p className="mt-2 text-xs text-[#f5f0e8]/50">These accounts were stored locally. Create a new account to sync your data securely.</p>
              <ul className="mt-3 space-y-3">
                {legacyAccounts
                  .slice()
                  .reverse()
                  .slice(0, 3)
                  .map(account => (
                    <li key={account.email} className="rounded-2xl border border-[#d4a44c]/20 bg-slate-950/80 p-3">
                      <div className="flex items-center justify-between text-[#f5f0e8]">
                        <span className="font-semibold">{account.name}</span>
                        <span className="text-xs uppercase tracking-[0.14em] text-[#f5f0e8]/70">{formatDate(account.createdAt)}</span>
                      </div>
                      <p className="text-xs text-[#f5f0e8]/70">{account.email}</p>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column - Auth Forms */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/60 p-6 shadow-[0_20px_70px_rgba(255,115,39,0.14)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-[#d4a44c]/20 bg-[#d4a44c]/10 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#e8b54a]" />
                Real-time validation
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#d4a44c]/20 bg-[#d4a44c]/10 px-3 py-1 text-xs font-semibold text-[#f5f0e8]">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
                Secure auth
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-[#d4a44c]/15 bg-[#d4a44c]/10 p-1 text-sm font-semibold text-[#f5f0e8]">
              <button
                onClick={() => { setMode('create'); setNeedsTwoFactor(false); resetStatus(); }}
                className={`flex-1 rounded-xl px-3 py-2 transition ${mode === 'create' ? 'bg-[#d4a44c]text-slate-950 shadow-md shadow-[#d4a44c]/30' : 'hover:bg-[#d4a44c]/20'}`}
              >
                Create Account
              </button>
              <button
                onClick={() => { setMode('login'); resetStatus(); }}
                className={`flex-1 rounded-xl px-3 py-2 transition ${mode === 'login' ? 'bg-[#d4a44c]text-slate-950 shadow-md shadow-[#d4a44c]/30' : 'hover:bg-[#d4a44c]/20'}`}
              >
                Sign In
              </button>
            </div>

            {status && (
              <div
                className={`mt-4 rounded-2xl border p-4 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50'
                    : status.type === 'info'
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-50'
                    : 'border-[#d4a44c]/40 bg-[#d4a44c]/10 text-[#f5f0e8]'
                }`}
              >
                {status.message}
              </div>
            )}

            {mode === 'create' ? (
              <form className="mt-6 space-y-4" onSubmit={handleCreate}>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="name">Full name</label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={createForm.name}
                    onChange={event => setCreateForm({ ...createForm, name: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                    placeholder="Alex Parker"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={createForm.email}
                    onChange={event => setCreateForm({ ...createForm, email: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                    placeholder="you@kiaanverse.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={createForm.password}
                    onChange={event => setCreateForm({ ...createForm, password: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                    placeholder="At least 8 characters"
                  />
                  <div className="flex items-center gap-3 text-xs text-[#f5f0e8]/80">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#d4a44c]/20">
                      <div className={`h-2 ${passwordStrength.bar}`} style={{ width: `${passwordStrength.percent}%` }} />
                    </div>
                    <span className="min-w-[88px] text-right font-semibold text-[#f5f0e8]">{passwordStrength.label}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
                <p className="text-center text-xs text-[#f5f0e8]/70">Your account is secured with bcrypt encryption.</p>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={event => setLoginForm({ ...loginForm, email: event.target.value.toLowerCase() })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                    placeholder="you@kiaanverse.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={event => setLoginForm({ ...loginForm, password: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                    placeholder="Enter your password"
                  />
                </div>
                {needsTwoFactor && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="two-factor">Two-Factor Code</label>
                    <input
                      id="two-factor"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={loginForm.twoFactorCode}
                      onChange={event => setLoginForm({ ...loginForm, twoFactorCode: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-cyan-500/30 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50"
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#f5f0e8]/75">
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="rounded-lg border border-[#d4a44c]/20 px-3 py-2 font-semibold text-[#f5f0e8] transition hover:border-[#d4a44c] hover:bg-[#d4a44c]/10"
                  >
                    Need an account? Create one
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-400/20 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in securely'}
                </button>
                <p className="text-center text-xs text-[#f5f0e8]/70">Secure authentication with session management.</p>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Account Page Client                                           */
/* ------------------------------------------------------------------ */
export default function AccountPageClient() {
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const signOut = async () => {
    setIsSubmitting(true)
    try {
      await logout()
    } catch {
      // Signed out regardless
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-3xl bg-[#d4a44c]/10" />
          <div className="h-48 rounded-3xl bg-[#d4a44c]/10" />
          <div className="h-48 rounded-3xl bg-[#d4a44c]/10" />
        </div>
      </main>
    )
  }

  if (isAuthenticated && user) {
    return (
      <AuthenticatedAccountView
        user={user}
        onSignOut={signOut}
        isSubmitting={isSubmitting}
      />
    )
  }

  return <UnauthenticatedAccountView />
}
