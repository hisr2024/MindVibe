'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { apiFetch } from '@/lib/api'

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [resendEmail, setResendEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!token || isVerifying || status) return

    const verify = async () => {
      setIsVerifying(true)
      try {
        const response = await apiFetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          const data = await response.json()
          setStatus({
            type: 'success',
            message: data.message || 'Email verified successfully! You can now log in.',
          })
        } else {
          const data = await response.json().catch(() => ({}))
          const detail = data.detail || 'Verification failed. The link may have expired.'
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
        setIsVerifying(false)
      }
    }

    verify()
  }, [token, isVerifying, status])

  const handleResend = async () => {
    if (!resendEmail) {
      setResendStatus({ type: 'error', message: 'Please enter your email address.' })
      return
    }

    setIsResending(true)
    setResendStatus(null)

    try {
      const response = await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })

      const data = await response.json().catch(() => ({}))
      setResendStatus({
        type: 'success',
        message: data.message || 'If an account with that email exists, a verification link has been sent.',
      })
    } catch {
      setResendStatus({
        type: 'error',
        message: 'Unable to reach the server. Please try again.',
      })
    } finally {
      setIsResending(false)
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
        <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/60 p-6 sm:p-8 shadow-[0_20px_70px_rgba(255,115,39,0.14)]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#f5f0e8]">Verify Your Email</h1>
            <p className="mt-2 text-sm text-[#f5f0e8]/75">
              Enter your email address to resend the verification link.
            </p>
          </div>

          {resendStatus && (
            <div
              className={`mb-6 rounded-2xl border p-4 text-sm ${
                resendStatus.type === 'success'
                  ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50'
                  : 'border-red-400/40 bg-red-400/10 text-red-50'
              }`}
            >
              {resendStatus.message}
            </div>
          )}

          <div className="space-y-4">
            <input
              type="email"
              value={resendEmail}
              onChange={e => setResendEmail(e.target.value)}
              disabled={isResending}
              className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
              placeholder="you@example.com"
            />
            <button
              onClick={handleResend}
              disabled={isResending}
              className="w-full rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

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

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/60 p-6 sm:p-8 shadow-[0_20px_70px_rgba(255,115,39,0.14)]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#f5f0e8]">Email Verification</h1>
        </div>

        {isVerifying && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#d4a44c]/30 border-t-[#d4a44c]" />
            <p className="mt-4 text-sm text-[#f5f0e8]/75">Verifying your email...</p>
          </div>
        )}

        {status && (
          <div
            className={`rounded-2xl border p-4 text-sm ${
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
            {status.type === 'error' && (
              <Link
                href="/auth/verify-email"
                className="mt-3 block text-center text-[#d4a44c] hover:text-[#e8b54a] font-semibold transition"
              >
                Request New Verification Link
              </Link>
            )}
          </div>
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

export default function VerifyEmailPage() {
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
      <VerifyEmailForm />
    </Suspense>
  )
}
