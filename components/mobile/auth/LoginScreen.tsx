'use client'

/**
 * LoginScreen — Sign-in orchestrator for mobile auth
 *
 * Handles email/password sign-in with form validation,
 * social auth (Google + Apple), and forgot password link.
 * CTA reads "Enter the Sanctuary" — not "Login".
 */

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { SacredAuthInput } from './SacredInput'
import { SocialAuthButtons } from './SocialAuthButtons'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'

interface LoginScreenProps {
  onSwitchToSignUp: () => void
}

export function LoginScreen({ onSwitchToSignUp }: LoginScreenProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!email) {
      errors.email = 'Please enter your email address'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!password) {
      errors.password = 'Please enter your password'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || data.error || 'Unable to sign in. Please check your credentials.')
        return
      }

      // Store user profile for auth state
      if (data.user) {
        localStorage.setItem('mindvibe_auth_user', JSON.stringify(data.user))
      }

      router.push('/m')
    } catch {
      setError('Connection issue. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    setSocialLoading(true)
    window.location.href = `/api/auth/${provider}`
  }

  const isValid = email && password

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
          or sign in with email
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,160,23,0.3)] to-transparent" />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="sacred-text-ui text-xs text-red-400 text-center">{error}</p>
        </div>
      )}

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
        placeholder="Enter your password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          setFieldErrors(prev => ({ ...prev, password: '' }))
        }}
        error={fieldErrors.password}
        autoComplete="current-password"
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

      {/* Forgot Password */}
      <div className="flex justify-end -mt-2 mb-5">
        <button
          type="button"
          onClick={() => router.push('/m/auth/forgot')}
          className="sacred-text-ui text-xs text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {/* CTA */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className="sacred-btn-divine sacred-shimmer-on-tap w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <SacredOMLoader size={24} />
        ) : (
          'Enter the Sanctuary'
        )}
      </button>

      {/* Switch to Sign Up */}
      <p className="sacred-text-ui text-xs text-[var(--sacred-text-muted)] text-center mt-5">
        New to Kiaanverse?{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors"
        >
          Begin your journey
        </button>
      </p>
    </form>
  )
}

export default LoginScreen
