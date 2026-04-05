'use client'

/**
 * SignUpScreen — Account creation orchestrator for mobile auth
 *
 * Handles registration with name, email, password + strength bar,
 * terms acceptance, social auth. CTA reads "Begin My Journey".
 */

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { SacredAuthInput } from './SacredInput'
import { SocialAuthButtons } from './SocialAuthButtons'
import { PasswordStrengthBar } from './PasswordStrengthBar'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

interface SignUpScreenProps {
  onSwitchToLogin: () => void
}

export function SignUpScreen({ onSwitchToLogin }: SignUpScreenProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [updatesOptIn, setUpdatesOptIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!firstName.trim()) errors.firstName = 'Please enter your first name'
    if (!lastName.trim()) errors.lastName = 'Please enter your last name'
    if (!email) {
      errors.email = 'Please enter your email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!password) {
      errors.password = 'Please create a password'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!termsAccepted) errors.terms = 'Please accept the terms to continue'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      // Backend SignupIn only accepts {email, password}
      const res = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('This email is already registered. Please sign in instead.')
        } else {
          // Backend returns {detail: {detail: "...", code: "..."}} for validation errors
          const msg = typeof data.detail === 'string'
            ? data.detail
            : data.detail?.detail || data.error || 'Unable to create account. Please try again.'
          setError(msg)
        }
        return
      }

      // Store basic profile info locally for display (backend doesn't store name at signup)
      localStorage.setItem('mindvibe_auth_user', JSON.stringify({
        id: data.user_id,
        email: data.email,
        name: `${firstName.trim()} ${lastName.trim()}`,
      }))

      // Save profile name via profile endpoint (best-effort, don't block signup)
      apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: `${firstName.trim()} ${lastName.trim()}` }),
      }).catch(() => { /* non-blocking */ })

      // Redirect to email verification — pass sent=false if email wasn't delivered
      const sentParam = data.email_verification_sent === false ? '&sent=false' : ''
      router.push(`/m/auth/verify?email=${encodeURIComponent(email)}${sentParam}`)
    } catch {
      setError('Connection issue. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    // Social auth OAuth endpoints — redirect to backend OAuth flow
    setSocialLoading(true)
    window.location.href = `/api/auth/oauth/${provider}`
  }

  const isValid = firstName && lastName && email && password.length >= 8 && termsAccepted

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      {/* Social Auth */}
      <SocialAuthButtons
        onGoogleAuth={() => handleSocialAuth('google')}
        onAppleAuth={() => handleSocialAuth('apple')}
        loading={socialLoading}
      />

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,160,23,0.3)] to-transparent" />
        <span className="sacred-text-ui text-xs text-[var(--sacred-text-muted)]">
          or create account with email
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,160,23,0.3)] to-transparent" />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="sacred-text-ui text-xs text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Name Fields - 2 column */}
      <div className="grid grid-cols-2 gap-3">
        <SacredAuthInput
          label="First name"
          placeholder="Arjuna"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value)
            setFieldErrors(prev => ({ ...prev, firstName: '' }))
          }}
          error={fieldErrors.firstName}
          autoComplete="given-name"
        />
        <SacredAuthInput
          label="Last name"
          placeholder="Pandava"
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value)
            setFieldErrors(prev => ({ ...prev, lastName: '' }))
          }}
          error={fieldErrors.lastName}
          autoComplete="family-name"
        />
      </div>

      {/* Email */}
      <SacredAuthInput
        label="Email"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setFieldErrors(prev => ({ ...prev, email: '' }))
        }}
        error={fieldErrors.email}
        autoComplete="email"
      />

      {/* Password */}
      <SacredAuthInput
        label="Password"
        type={showPassword ? 'text' : 'password'}
        placeholder="Create a strong password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setFieldErrors(prev => ({ ...prev, password: '' }))
        }}
        error={fieldErrors.password}
        autoComplete="new-password"
        icon={
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
        }
        onIconPress={() => setShowPassword(!showPassword)}
      />
      <PasswordStrengthBar password={password} />

      {/* Terms Checkbox */}
      <label className="flex items-start gap-3 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => {
            setTermsAccepted(e.target.checked)
            setFieldErrors(prev => ({ ...prev, terms: '' }))
          }}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center flex-shrink-0 mt-0.5 ${
            termsAccepted
              ? 'bg-[var(--sacred-krishna-blue)] border-[var(--sacred-divine-gold)]'
              : 'bg-[rgba(22,26,66,0.55)] border-[rgba(212,160,23,0.3)]'
          }`}
        >
          <svg
            className={`w-3 h-3 text-white transition-opacity ${termsAccepted ? 'opacity-100' : 'opacity-0'}`}
            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        </div>
        <span className="sacred-text-ui text-xs text-[var(--sacred-text-secondary)] leading-relaxed">
          I agree to the{' '}
          <span className="text-[var(--sacred-divine-gold)]">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[var(--sacred-divine-gold)]">Privacy Policy</span>
        </span>
      </label>
      {fieldErrors.terms && (
        <p className="sacred-text-ui text-xs text-red-400 mb-3 ml-8">{fieldErrors.terms}</p>
      )}

      {/* Updates Checkbox */}
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={updatesOptIn}
          onChange={(e) => setUpdatesOptIn(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded-md border transition-all flex items-center justify-center flex-shrink-0 mt-0.5 ${
            updatesOptIn
              ? 'bg-[var(--sacred-krishna-blue)] border-[var(--sacred-divine-gold)]'
              : 'bg-[rgba(22,26,66,0.55)] border-[rgba(212,160,23,0.3)]'
          }`}
        >
          <svg
            className={`w-3 h-3 text-white transition-opacity ${updatesOptIn ? 'opacity-100' : 'opacity-0'}`}
            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        </div>
        <span className="sacred-text-ui text-xs text-[var(--sacred-text-muted)] leading-relaxed">
          Send me spiritual insights and Kiaanverse updates
        </span>
      </label>

      {/* CTA */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="sacred-btn-divine sacred-shimmer-on-tap w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <SacredOMLoader size={24} />
        ) : (
          'Begin My Journey'
        )}
      </button>

      {/* Trial note */}
      <p className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)] text-center mt-3">
        7 days free · No card required
      </p>

      {/* Switch to Login */}
      <p className="sacred-text-ui text-xs text-[var(--sacred-text-muted)] text-center mt-5">
        Already on the path?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  )
}

export default SignUpScreen
