'use client'

/**
 * Mobile Email Verification Page — OTP code entry
 *
 * Displayed after signup. User enters the 6-digit code from their email.
 * Supports auto-paste and resend with cooldown timer.
 */

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { OTPVerification } from '@/components/mobile/auth/OTPVerification'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)

  const handleVerify = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      const res = await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Invalid code. Please check and try again.')
        setLoading(false)
        return
      }

      setVerified(true)
      // Navigate to plan selection after brief celebration
      setTimeout(() => {
        router.push('/m/subscribe')
      }, 1500)
    } catch {
      setError('Connection issue. Please try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resend: true }),
      })
    } catch {
      // Silently handle — resend timer prevents spam
    }
  }

  if (verified) {
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

  return (
    <>
      <AuthHeader
        title="Verify Your Email"
        subtitle="Checking your email..."
      />
      <div className="mt-4">
        <OTPVerification
          email={email}
          onComplete={handleVerify}
          onResend={handleResend}
          loading={loading}
          error={error}
        />
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
