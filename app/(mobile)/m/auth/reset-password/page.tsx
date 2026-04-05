'use client'

/**
 * Mobile Reset Password Page — Complete password reset from email link
 *
 * Three states:
 * 1. No token — "Invalid Reset Link" error with link to forgot page
 * 2. Form — New password + confirm password with strength bar
 * 3. Success — Green checkmark + "Return to sign in" button
 *
 * Backend contract: POST /api/auth/reset-password { token, new_password }
 */

import { useState, Suspense, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { SacredAuthInput } from '@/components/mobile/auth/SacredInput'
import { PasswordStrengthBar } from '@/components/mobile/auth/PasswordStrengthBar'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

type ResetStatus = 'form' | 'loading' | 'success' | 'error'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<ResetStatus>('form')
  const [error, setError] = useState('')

  // No token — invalid link
  if (!token) {
    return (
      <>
        <AuthHeader
          title="Invalid Reset Link"
          subtitle="This link is invalid or has expired"
        />
        <div className="flex flex-col items-center mt-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)] text-center mb-6 max-w-[280px]">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            type="button"
            onClick={() => router.push('/m/auth/forgot')}
            className="sacred-btn-divine px-8 mb-3"
          >
            Request New Link
          </button>
          <button
            type="button"
            onClick={() => router.push('/m/auth/login')}
            className="sacred-text-ui text-xs text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors"
          >
            Return to sign in
          </button>
        </div>
      </>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <>
        <AuthHeader
          title="Password Reset"
          subtitle="Your password has been updated"
        />
        <div className="flex flex-col items-center mt-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)] text-center mb-6 max-w-[280px]">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <button
            type="button"
            onClick={() => router.push('/m/auth/login')}
            className="sacred-btn-divine px-8"
          >
            Return to sign in
          </button>
        </div>
      </>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setStatus('loading')
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json().catch(() => ({}))
        const raw = data.detail
        let msg: string
        if (typeof raw === 'string') {
          msg = raw
        } else if (Array.isArray(raw)) {
          // 422 validation errors: [{msg: "...", ...}, ...]
          msg = raw.map((e: { msg?: string; detail?: string }) => e.msg || e.detail || '').filter(Boolean).join('. ') || 'Password does not meet requirements.'
        } else if (raw && typeof raw === 'object' && raw.detail) {
          msg = typeof raw.detail === 'string' ? raw.detail : 'Failed to reset password. The link may have expired.'
        } else {
          msg = 'Failed to reset password. The link may have expired.'
        }
        setError(msg)
        setStatus('error')
      }
    } catch {
      setError('Connection issue. Please try again.')
      setStatus('error')
    }
  }

  const passwordIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {showPassword ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )

  return (
    <>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 pt-14 pb-2 text-[var(--sacred-text-muted)] sacred-text-ui text-sm"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <AuthHeader
        title="Set New Password"
        subtitle="Choose a strong password for your account"
      />

      <form onSubmit={handleSubmit} className="mt-2" noValidate>
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="sacred-text-ui text-xs text-red-400 text-center">{error}</p>
          </div>
        )}

        <SacredAuthInput
          label="New password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          autoComplete="new-password"
          icon={passwordIcon}
          onIconPress={() => setShowPassword(!showPassword)}
        />
        <PasswordStrengthBar password={password} />

        <SacredAuthInput
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            setError('')
          }}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={!password || !confirmPassword || status === 'loading'}
          className="sacred-btn-divine sacred-shimmer-on-tap w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <SacredOMLoader size={24} />
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <p className="sacred-text-ui text-xs text-[var(--sacred-text-muted)] text-center mt-5">
        <button
          type="button"
          onClick={() => router.push('/m/auth/login')}
          className="text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors"
        >
          Return to sign in
        </button>
      </p>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] px-5 pb-10">
      <Suspense fallback={
        <div className="flex items-center justify-center pt-32">
          <SacredOMLoader size={48} message="Loading..." />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
