'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { apiFetch } from '@/lib/api'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const passwordStrength = useMemo(() => {
    const requirements = [/.{8,}/, /[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/]
    const fulfilled = requirements.filter(rule => rule.test(password)).length
    const levels = ['Fragile', 'Getting there', 'Ready', 'Strong', 'Elite']
    const colors = ['bg-red-400/70', 'bg-orange-400/70', 'bg-yellow-400/70', 'bg-emerald-400/80', 'bg-teal-300/80']
    return {
      label: levels[Math.min(fulfilled, levels.length - 1)],
      percent: Math.max(16, Math.round((fulfilled / requirements.length) * 100)),
      bar: colors[Math.min(fulfilled, colors.length - 1)],
    }
  }, [password])

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <div className="rounded-3xl border border-red-400/20 bg-black/60 p-6 sm:p-8 text-center">
          <h1 className="text-2xl font-bold text-[#f5f0e8] mb-4">Invalid Reset Link</h1>
          <p className="text-sm text-[#f5f0e8]/60 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block rounded-xl bg-gradient-to-r from-[#d4a44c] to-[#e8b54a] px-6 py-3 text-sm font-semibold text-slate-900"
          >
            Request New Link
          </Link>
        </div>
      </main>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    if (!password || password.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters.' })
      return
    }

    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Password has been reset successfully! You can now sign in with your new password.',
        })
        setPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json().catch(() => ({}))
        const detail = data.detail || 'Failed to reset password. The link may have expired.'
        setStatus({
          type: 'error',
          message: typeof detail === 'string' ? detail : JSON.stringify(detail),
        })
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Unable to reach the server. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/60 p-6 sm:p-8 shadow-[0_20px_70px_rgba(255,115,39,0.14)]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#f5f0e8]">Set New Password</h1>
          <p className="mt-2 text-sm text-[#f5f0e8]/60">
            Choose a strong password for your account.
          </p>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm ${
              status.type === 'success'
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50'
                : 'border-red-400/40 bg-red-400/10 text-red-50'
            }`}
          >
            {status.message}
            {status.type === 'success' && (
              <Link
                href="/account"
                className="mt-3 block text-center text-[#d4a44c] hover:text-[#e8b54a] font-semibold transition"
              >
                Go to Sign In
              </Link>
            )}
          </div>
        )}

        {status?.type !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                placeholder="At least 8 characters"
              />
              {password && (
                <div className="flex items-center gap-3 text-xs text-[#f5f0e8]/80">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#d4a44c]/20">
                    <div className={`h-2 ${passwordStrength.bar}`} style={{ width: `${passwordStrength.percent}%` }} />
                  </div>
                  <span className="min-w-[88px] text-right font-semibold text-[#f5f0e8]">{passwordStrength.label}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
                placeholder="Re-enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/account"
            className="text-sm text-[#d4a44c] hover:text-[#e8b54a] transition"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
          <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/60 p-6 sm:p-8 text-center">
            <div className="h-8 w-48 mx-auto rounded bg-[#d4a44c]/10 animate-pulse" />
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
