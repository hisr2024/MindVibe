'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api'
import { WakeWordSettings } from '@/components/wake-word/WakeWordSettings'

type LegacyAccount = {
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

type Status = { type: 'success' | 'error' | 'info'; message: string }

const LEGACY_ACCOUNT_STORAGE_KEY = 'mindvibe_accounts_v2'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString))
}

export default function AccountPageClient() {
  const { user, isAuthenticated, login, signup, logout, loading: authLoading, error: authError } = useAuth()

  const [mode, setMode] = useState<'create' | 'login'>('create')
  const [legacyAccounts, setLegacyAccounts] = useState<LegacyAccount[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  })

  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)

  // Load legacy accounts for display purposes only
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(LEGACY_ACCOUNT_STORAGE_KEY)
    if (stored) setLegacyAccounts(JSON.parse(stored))
    setHydrated(true)
  }, [])

  // Show auth errors
  useEffect(() => {
    if (authError) {
      setStatus({ type: 'error', message: authError })
    }
  }, [authError])

  const passwordStrength = useMemo(() => {
    const requirements = [
      /.{8,}/,
      /[A-Z]/,
      /[a-z]/,
      /[0-9]/,
      /[^A-Za-z0-9]/,
    ]
    const fulfilled = requirements.filter(rule => rule.test(createForm.password)).length
    const levels = ['Fragile', 'Getting there', 'Ready', 'Strong', 'Elite', 'Elite']
    const colors = ['bg-orange-500/50', 'bg-orange-500/70', 'bg-amber-400/80', 'bg-emerald-400/80', 'bg-teal-300/80', 'bg-teal-200']

    return {
      label: levels[Math.min(fulfilled, levels.length - 1)],
      percent: Math.max(16, Math.round((fulfilled / requirements.length) * 100)),
      bar: colors[Math.min(fulfilled, colors.length - 1)],
    }
  }, [createForm.password])

  const resetStatus = () => setStatus(null)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    resetStatus()

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setStatus({ type: 'error', message: 'Add your name, email, and a strong password to continue.' })
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim())) {
      setStatus({ type: 'error', message: 'Use a valid email address so we can keep things in sync.' })
      return
    }

    if (createForm.password.length < 8) {
      setStatus({ type: 'error', message: 'Use at least 8 characters with a mix of cases, numbers, and symbols.' })
      return
    }

    setIsSubmitting(true)

    try {
      // Call backend signup API via useAuth hook
      const authUser = await signup(createForm.email.trim(), createForm.password, createForm.name.trim())

      // Create profile with name after signup
      try {
        await apiFetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: createForm.name.trim(),
            base_experience: 'new_user', // Required field
          }),
        })
      } catch (profileError) {
        // Profile creation is optional, don't fail the signup
        console.warn('Profile creation failed:', profileError)
      }

      setStatus({ type: 'success', message: 'Account created successfully! You are now signed in.' })
      setCreateForm({ name: '', email: '', password: '' })
      setLoginForm({ email: authUser.email, password: '', twoFactorCode: '' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account. Please try again.'
      setStatus({ type: 'error', message })

      // If email already exists, suggest login
      if (message.toLowerCase().includes('already registered') || message.toLowerCase().includes('already exists')) {
        setMode('login')
        setLoginForm(prev => ({ ...prev, email: createForm.email.trim().toLowerCase() }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    resetStatus()

    if (!loginForm.email.trim() || !loginForm.password) {
      setStatus({ type: 'error', message: 'Enter your email and password to sign in.' })
      return
    }

    setIsSubmitting(true)

    try {
      await login(loginForm.email.trim(), loginForm.password, loginForm.twoFactorCode || undefined)

      setStatus({ type: 'success', message: 'Signed in successfully! Your journey awaits.' })
      setLoginForm({ email: '', password: '', twoFactorCode: '' })
      setNeedsTwoFactor(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'

      // Check if 2FA is required
      if (message.toLowerCase().includes('two-factor') || message.toLowerCase().includes('2fa')) {
        setNeedsTwoFactor(true)
        setStatus({ type: 'info', message: 'Enter your two-factor authentication code.' })
      } else if (message.toLowerCase().includes('locked')) {
        setStatus({ type: 'error', message })
      } else {
        setStatus({ type: 'error', message })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const signOut = async () => {
    setIsSubmitting(true)
    try {
      await logout()
      setStatus({ type: 'info', message: 'Signed out. You can log back in anytime.' })
    } catch (err) {
      setStatus({ type: 'info', message: 'Signed out successfully.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const accountCreatedAt = user ? new Date().toISOString() : null

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0f0a08] via-[#0b0b0f] to-[#0c0f19] p-8 shadow-[0_24px_100px_rgba(255,115,39,0.18)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-orange-100/75">Account</p>
          <h1 className="text-3xl font-bold text-orange-50">Access your account</h1>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          {isAuthenticated && user ? (
            <div className="flex flex-col gap-3 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-50 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/80">Signed in</p>
                  <p className="text-lg font-semibold text-emerald-50">{user.name || user.email.split('@')[0]}</p>
                  <p className="text-emerald-50/80">{user.email}</p>
                </div>
                <button
                  onClick={signOut}
                  disabled={isSubmitting}
                  className="rounded-xl border border-emerald-200/40 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:border-emerald-100 hover:bg-emerald-100/10 disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
              <div className="flex items-center justify-between text-emerald-50/80">
                <p>Session active</p>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 px-3 py-2 text-xs font-semibold text-slate-900 shadow-md shadow-emerald-400/20 transition hover:scale-[1.01]"
                >
                  Continue to dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-orange-500/20 bg-black/40 p-5 text-sm text-orange-100/80">
              <p className="font-semibold text-orange-50">No active session</p>
              <p className="mt-1">Create an account or log in to unlock your personalized flows.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-orange-500/20 bg-black/60 p-6 shadow-[0_20px_70px_rgba(255,115,39,0.14)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-50">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-300" />
                Real-time validation
              </div>
              <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-50">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
                Secure authentication
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-1 text-sm font-semibold text-orange-50">
              <button
                onClick={() => { setMode('create'); setNeedsTwoFactor(false); resetStatus(); }}
                className={`flex-1 rounded-xl px-3 py-2 transition ${mode === 'create' ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/30' : 'hover:bg-orange-500/20'}`}
              >
                Create Account
              </button>
              <button
                onClick={() => { setMode('login'); resetStatus(); }}
                className={`flex-1 rounded-xl px-3 py-2 transition ${mode === 'login' ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/30' : 'hover:bg-orange-500/20'}`}
              >
                Login with Password
              </button>
            </div>

            {status && (
              <div
                className={`mt-4 rounded-2xl border p-4 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-50'
                    : status.type === 'info'
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-50'
                    : 'border-orange-400/40 bg-orange-500/10 text-orange-50'
                }`}
              >
                {status.message}
              </div>
            )}

            {mode === 'create' ? (
              <form className="mt-6 space-y-4" onSubmit={handleCreate}>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={createForm.name}
                    onChange={event => setCreateForm({ ...createForm, name: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
                    placeholder="Alex Parker"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={createForm.email}
                    onChange={event => setCreateForm({ ...createForm, email: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
                    placeholder="you@mindvibe.life"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={createForm.password}
                    onChange={event => setCreateForm({ ...createForm, password: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
                    placeholder="At least 8 characters"
                  />
                  <div className="flex items-center gap-3 text-xs text-orange-100/80">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-orange-500/20">
                      <div className={`h-2 ${passwordStrength.bar}`} style={{ width: `${passwordStrength.percent}%` }} />
                    </div>
                    <span className="min-w-[88px] text-right font-semibold text-orange-50">{passwordStrength.label}</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
                <p className="text-center text-xs text-orange-100/70">Your account is secured with bcrypt encryption.</p>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="login-email">
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={loginForm.email}
                    onChange={event => setLoginForm({ ...loginForm, email: event.target.value.toLowerCase() })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
                    placeholder="you@mindvibe.life"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="login-password">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={loginForm.password}
                    onChange={event => setLoginForm({ ...loginForm, password: event.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40 disabled:opacity-50"
                    placeholder="Enter your password"
                  />
                </div>
                {needsTwoFactor && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-orange-50" htmlFor="two-factor">
                      Two-Factor Code
                    </label>
                    <input
                      id="two-factor"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={loginForm.twoFactorCode}
                      onChange={event => setLoginForm({ ...loginForm, twoFactorCode: event.target.value.replace(/\D/g, '').slice(0, 6) })}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-cyan-500/30 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-50"
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-orange-100/75">
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="rounded-lg border border-orange-500/20 px-3 py-2 font-semibold text-orange-50 transition hover:border-orange-400 hover:bg-orange-500/10"
                  >
                    Need an account? Create one
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-400/20 transition hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in securely'}
                </button>
                <p className="text-center text-xs text-orange-100/70">Secure authentication with session management.</p>
              </form>
            )}
          </div>

          {/* Show legacy accounts if any exist */}
          {legacyAccounts.length > 0 && (
            <div className="rounded-3xl border border-orange-500/15 bg-black/50 p-5 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/60">Previous local accounts</p>
              <p className="mt-2 text-xs text-orange-100/50">These accounts were stored locally. Create a new account to sync your data securely.</p>
              <ul className="mt-3 space-y-3">
                {legacyAccounts
                  .slice()
                  .reverse()
                  .slice(0, 3)
                  .map(account => (
                    <li key={account.email} className="rounded-2xl border border-orange-500/20 bg-slate-950/80 p-3">
                      <div className="flex items-center justify-between text-orange-50">
                        <span className="font-semibold">{account.name}</span>
                        <span className="text-xs uppercase tracking-[0.14em] text-orange-100/70">{formatDate(account.createdAt)}</span>
                      </div>
                      <p className="text-xs text-orange-100/70">{account.email}</p>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* KIAAN Voice Settings */}
      <section className="space-y-4">
        <div className="space-y-1 px-1">
          <h2 className="text-lg font-semibold text-orange-50">KIAAN Voice</h2>
          <p className="text-xs text-orange-200/50">Wake up KIAAN with your voice from anywhere</p>
        </div>
        <WakeWordSettings />
      </section>
    </main>
  )
}
