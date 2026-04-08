'use client'

/**
 * Mobile Forgot Password Page — Password reset flow
 *
 * Simple: email input + "Send Reset Link" CTA.
 * After send: success message + "Check your inbox" instruction.
 */

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { SacredAuthInput } from '@/components/mobile/auth/SacredInput'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // Always show success to prevent email enumeration
      setSent(true)
    } catch {
      setError('Connection issue. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] px-5 pb-10">
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
        title="Reset Password"
        subtitle="We'll send you a link to reset your password"
      />

      {sent ? (
        /* Success state */
        <div className="flex flex-col items-center text-center mt-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="sacred-text-divine text-lg text-[var(--sacred-text-primary)] mb-2">
            Check your inbox
          </h2>
          <p className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)] mb-8 max-w-[280px]">
            If an account exists for <span className="text-[var(--sacred-divine-gold-bright)]">{email}</span>,
            you&apos;ll receive a password reset link shortly.
          </p>
          <button
            onClick={() => router.push('/m/auth/login')}
            className="sacred-btn-ghost px-8"
          >
            Return to sign in
          </button>
        </div>
      ) : (
        /* Form state */
        <form onSubmit={handleSubmit} className="mt-2" noValidate>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="sacred-text-ui text-xs text-red-400 text-center">{error}</p>
            </div>
          )}

          <SacredAuthInput
            label="Email address"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError('')
            }}
            autoComplete="email"
            autoFocus
          />

          <button
            type="submit"
            disabled={!email || loading}
            className="sacred-btn-divine sacred-shimmer-on-tap w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? (
              <SacredOMLoader size={24} />
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
