'use client'

/**
 * Mobile Email Verification Page
 *
 * Two modes:
 * 1. Token mode (?token=xxx) — Auto-verifies via backend, shown when user
 *    clicks the verification link in their email.
 * 2. Waiting mode (?email=xxx) — Shows "check your email" instructions
 *    with a resend button. Shown after signup.
 *
 * Backend contract:
 *   POST /api/auth/verify-email      { token: string }
 *   POST /api/auth/resend-verification { email: string }
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

const RESEND_COOLDOWN = 60

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || ''
  const emailWasSent = searchParams.get('sent') !== 'false'

  // Start in 'loading' state when token is present (avoids setState in effect)
  const [status, setStatus] = useState<'loading' | 'waiting' | 'verified' | 'error'>(token ? 'loading' : 'waiting')
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)

  // If token is present in URL, auto-verify
  useEffect(() => {
    if (!token) return

    apiFetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('verified')
          setTimeout(() => router.push('/m/subscribe'), 2000)
        } else {
          const data = await res.json().catch(() => ({}))
          const msg = typeof data.detail === 'string'
            ? data.detail
            : data.detail?.detail || 'Verification link is invalid or has expired.'
          setError(msg)
          setStatus('error')
        }
      })
      .catch(() => {
        setError('Connection issue. Please try again.')
        setStatus('error')
      })
  }, [token, router])

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleResend = async () => {
    if (!email) return
    setResendTimer(RESEND_COOLDOWN)
    setResendSuccess(false)

    try {
      const res = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setResendSuccess(true)
      }
    } catch {
      // Silently handle — timer prevents spam
    }
  }

  // --- Token auto-verification: loading state ---
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center pt-32">
        <SacredOMLoader size={48} message="Verifying your email..." />
      </div>
    )
  }

  // --- Verified success state ---
  if (status === 'verified') {
    return (
      <div className="flex flex-col items-center text-center mt-12">
        <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="sacred-text-divine text-lg text-[var(--sacred-text-primary)]">
          Email Verified
        </h2>
        <p className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)] mt-2">
          Preparing your sacred journey...
        </p>
      </div>
    )
  }

  // --- Error state (expired/invalid token) ---
  if (status === 'error') {
    return (
      <>
        <AuthHeader
          title="Verification Failed"
          subtitle="The link may have expired"
        />
        <div className="flex flex-col items-center mt-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="sacred-text-ui text-sm text-red-400 text-center mb-6 max-w-[280px]">
            {error}
          </p>
          {email && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendTimer > 0}
              className="sacred-btn-divine px-8 mb-3 disabled:opacity-50"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Verification Email'}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push('/m/auth/login')}
            className="sacred-btn-ghost px-8"
          >
            Return to sign in
          </button>
        </div>
      </>
    )
  }

  // --- Waiting state (after signup, no token yet) ---
  return (
    <>
      <AuthHeader
        title={emailWasSent ? 'Check Your Email' : 'Verify Your Email'}
        subtitle={emailWasSent ? "We've sent a verification link" : 'Verification email could not be sent'}
      />
      <div className="flex flex-col items-center mt-6">
        {/* Email icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
          emailWasSent
            ? 'bg-[rgba(27,79,187,0.15)] border border-[rgba(27,79,187,0.3)]'
            : 'bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)]'
        }`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={emailWasSent ? 'var(--sacred-krishna-glow)' : '#F59E0B'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
          </svg>
        </div>

        {!emailWasSent && (
          <div className="mb-4 p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] max-w-[300px]">
            <p className="sacred-text-ui text-xs text-amber-400 text-center leading-relaxed">
              We were unable to send a verification email. Please try the resend button below, or contact support if the issue persists.
            </p>
          </div>
        )}

        <p className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)] text-center max-w-[300px] leading-relaxed">
          {emailWasSent ? "We've sent a verification link to" : 'A verification link is needed for'}
        </p>
        {email && (
          <p className="sacred-text-ui text-sm text-[var(--sacred-divine-gold-bright)] mt-1 mb-6">
            {email}
          </p>
        )}
        <p className="sacred-text-ui text-xs text-[var(--sacred-text-muted)] text-center max-w-[280px] mb-8 leading-relaxed">
          {emailWasSent
            ? "Click the link in your email to verify your account. Check your spam folder if you don't see it."
            : 'Tap the resend button below to request a new verification email.'}
        </p>

        {/* Resend */}
        {resendSuccess && (
          <p className="sacred-text-ui text-xs text-emerald-400 mb-3">
            Verification email resent successfully
          </p>
        )}
        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0}
            className="sacred-text-ui text-xs text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors disabled:text-[var(--sacred-text-muted)] mb-6"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Didn't receive it? Resend email"}
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push('/m/auth/login')}
          className="sacred-btn-ghost px-8"
        >
          Return to sign in
        </button>
      </div>
    </>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] px-5 pb-10">
      <Suspense fallback={
        <div className="flex items-center justify-center pt-32">
          <SacredOMLoader size={48} message="Loading..." />
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
