'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { apiFetch } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus(null)

    if (!email.trim()) {
      setStatus({ type: 'error', message: 'Please enter your email address.' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'If an account with that email exists, a password reset link has been sent. Please check your inbox.',
        })
        setEmail('')
      } else {
        const data = await response.json().catch(() => ({}))
        setStatus({
          type: 'error',
          message: data.detail || 'Something went wrong. Please try again.',
        })
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Unable to reach the server. Please check your connection and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#d4a44c]/20 bg-black/60 p-6 sm:p-8 shadow-[0_20px_70px_rgba(255,115,39,0.14)]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#f5f0e8]">Reset Password</h1>
          <p className="mt-2 text-sm text-[#f5f0e8]/75">
            Enter your email and we will send you a link to reset your password.
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
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#f5f0e8]" htmlFor="reset-email">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40 disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

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
