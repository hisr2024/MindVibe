'use client'

import { FormEvent, Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { SettingsSection } from '@/components/settings'
import { apiFetch } from '@/lib/api'

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const passwordStrength = useMemo(() => {
    const requirements = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/]
    const fulfilled = requirements.filter(rule => rule.test(newPassword)).length
    const levels = ['Fragile', 'Getting there', 'Ready', 'Strong', 'Elite']
    const colors = ['bg-red-400/70', 'bg-orange-400/70', 'bg-yellow-400/70', 'bg-emerald-400/80', 'bg-teal-300/80']
    return {
      label: levels[Math.min(fulfilled, levels.length - 1)],
      percent: Math.max(16, Math.round((fulfilled / requirements.length) * 100)),
      bar: colors[Math.min(fulfilled, colors.length - 1)],
    }
  }, [newPassword])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    if (!currentPassword) {
      setStatus({ type: 'error', message: 'Please enter your current password.' })
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          revoke_other_sessions: revokeOtherSessions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const sessionsMsg = data.sessions_revoked > 0
          ? ` ${data.sessions_revoked} other session(s) have been signed out.`
          : ''
        setStatus({ type: 'success', message: `Password changed successfully.${sessionsMsg}` })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json().catch(() => ({}))
        const raw = data.detail
        const message =
          typeof raw === 'string'
            ? raw
            : typeof raw === 'object' && raw?.detail
              ? raw.detail
              : typeof raw === 'object' && raw?.message
                ? raw.message
                : 'Failed to change password. Please try again.'
        setStatus({ type: 'error', message })
      }
    } catch {
      setStatus({ type: 'error', message: 'Unable to reach the server. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SettingsSection
      title="Change Password"
      description="Update your account password"
      className="mb-6"
    >
      <Card variant="bordered">
        <CardContent>
          {status && (
            <div
              className={`mb-5 rounded-2xl border p-4 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50'
                  : 'border-red-400/40 bg-red-400/10 text-red-50'
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="current-password">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                placeholder="Enter your current password"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                placeholder="At least 8 characters"
              />
              {newPassword && (
                <div className="flex items-center gap-3 text-xs text-[#f5f0e8]/80">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#d4a44c]/20">
                    <div className={`h-2 ${passwordStrength.bar}`} style={{ width: `${passwordStrength.percent}%` }} />
                  </div>
                  <span className="min-w-[88px] text-right font-semibold text-[#f5f0e8]">{passwordStrength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="confirm-new-password">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                placeholder="Re-enter your new password"
              />
            </div>

            {/* Revoke Other Sessions Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeOtherSessions}
                onChange={e => setRevokeOtherSessions(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 h-4 w-4 rounded border-[#d4a44c]/40 bg-slate-900/70 text-[#d4a44c] focus:ring-[#d4a44c]/40"
              />
              <div>
                <p className="text-sm font-medium text-[#f5f0e8]">Sign out of all other devices</p>
                <p className="text-xs text-[#f5f0e8]/60 mt-0.5">
                  Recommended for security. Keeps only your current session active.
                </p>
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-[#d4a44c] hover:text-[#e8b54a] transition"
            >
              Forgot your current password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </SettingsSection>
  )
}

function SecuritySettingsContent() {
  return (
    <main className="mx-auto max-w-3xl px-page-x py-12">
      <div className="mb-8">
        <Link href="/settings" className="text-[#d4a44c] hover:text-[#e8b54a] text-sm mb-4 inline-block">
          &larr; Back to Settings
        </Link>
        <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
        <p className="text-[#f5f0e8]/70">Manage your account security</p>
      </div>

      {/* Active Sessions */}
      <SettingsSection
        title="Active Sessions"
        description="Manage devices logged into your account"
        className="mb-6"
      >
        <Card variant="bordered">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#f5f0e8]">View All Sessions</p>
              <p className="text-xs text-[#f5f0e8]/70">
                See and revoke access from other devices
              </p>
            </div>
            <Link href="/settings/security/sessions">
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Change Password */}
      <ChangePasswordSection />

      {/* Security Tips */}
      <SettingsSection
        title="Security Best Practices"
        description="Tips to keep your account secure"
        className="mb-6"
      >
        <div className="space-y-3">
          <div className="p-4 bg-black/20 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#f5f0e8] text-sm">Use a strong, unique password</p>
                <p className="text-xs text-[#f5f0e8]/70 mt-1">
                  Combine uppercase, lowercase, numbers, and symbols. Never reuse passwords.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#f5f0e8] text-sm">Review active sessions regularly</p>
                <p className="text-xs text-[#f5f0e8]/70 mt-1">
                  Revoke access from devices you don&apos;t recognize or no longer use.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#f5f0e8] text-sm">Be cautious of phishing</p>
                <p className="text-xs text-[#f5f0e8]/70 mt-1">
                  Never share your password. We&apos;ll never ask for it via email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </main>
  )
}

export default function SecuritySettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-page-x py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-[#d4a44c]/20 rounded w-48 mb-4" />
            <div className="h-4 bg-[#d4a44c]/10 rounded w-64 mb-8" />
            <div className="h-64 bg-[#d4a44c]/10 rounded-xl" />
          </div>
        </main>
      }
    >
      <SecuritySettingsContent />
    </Suspense>
  )
}
