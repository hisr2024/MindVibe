'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

type Account = {
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

type Status = { type: 'success' | 'error' | 'info'; message: string }

const ACCOUNT_STORAGE_KEY = 'mindvibe_accounts_v2'

async function hashPassword(password: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString))
}

export default function AccountPageClient() {
  const [mode, setMode] = useState<'create' | 'login'>('create')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [sessionUser, setSessionUser] = useState<Account | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY)
    const storedSession = window.sessionStorage.getItem('mindvibe_session_user')
    if (stored) setAccounts(JSON.parse(stored))
    if (storedSession) setSessionUser(JSON.parse(storedSession))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts))
  }, [accounts, hydrated])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionUser) {
      window.sessionStorage.setItem('mindvibe_session_user', JSON.stringify(sessionUser))
    } else {
      window.sessionStorage.removeItem('mindvibe_session_user')
    }
  }, [sessionUser])

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

    const exists = accounts.some(account => account.email.toLowerCase() === createForm.email.trim().toLowerCase())
    if (exists) {
      setStatus({ type: 'error', message: 'You already have an account. Switch to Login to continue.' })
      setMode('login')
      return
    }

    const passwordHash = await hashPassword(createForm.password)
    const newAccount: Account = {
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    setAccounts(current => [...current, newAccount])
    setSessionUser(newAccount)
    setStatus({ type: 'success', message: 'Account created. You are signed in and ready to continue.' })
    setCreateForm({ name: '', email: '', password: '' })
    setLoginForm({ email: newAccount.email, password: '' })
  }

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    resetStatus()

    if (!loginForm.email.trim() || !loginForm.password) {
      setStatus({ type: 'error', message: 'Enter your email and password to sign in.' })
      return
    }

    const account = accounts.find(acc => acc.email === loginForm.email.trim().toLowerCase())
    if (!account) {
      setStatus({ type: 'error', message: 'No account found for that email. Try Create Account instead.' })
      setMode('create')
      return
    }

    const passwordHash = await hashPassword(loginForm.password)
    if (passwordHash !== account.passwordHash) {
      setStatus({ type: 'error', message: 'Password does not match. Try again with the correct password.' })
      return
    }

    setSessionUser(account)
    setStatus({ type: 'success', message: 'Signed in. Your journey is synced and ready.' })
    setLoginForm({ email: account.email, password: '' })
  }

  const signOut = () => {
    setSessionUser(null)
    setStatus({ type: 'info', message: 'Signed out. You can log back in anytime.' })
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0f0a08] via-[#0b0b0f] to-[#0c0f19] p-8 shadow-[0_24px_100px_rgba(255,115,39,0.18)]">
        <p className="text-xs uppercase tracking-[0.26em] text-orange-100/75">Account</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-orange-50">Create, log in, and keep your support synced</h1>
            <p className="max-w-2xl text-orange-100/80">
              Streamlined account access inspired by the smoothest consumer apps. Fast, focused, and privacy-forward so you can get back to what matters.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-black/40 px-4 py-3 text-sm text-orange-100/80 shadow-lg shadow-orange-500/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-200 text-slate-900 font-semibold">MV</span>
            <div>
              <p className="text-orange-50 font-semibold">World-class polish</p>
              <p className="text-orange-100/70">Zero clutter, just decisive actions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-orange-100/70">
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
            Responsive, accessible, immediate
            <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-orange-500/15 bg-black/50 p-4">
              <p className="text-sm font-semibold text-orange-50">Local-first security</p>
              <p className="mt-1 text-sm text-orange-100/75">Credentials stay on-device with hashed passwords and instant validation.</p>
            </div>
            <div className="rounded-2xl border border-orange-500/15 bg-black/50 p-4">
              <p className="text-sm font-semibold text-orange-50">Momentum preserved</p>
              <p className="mt-1 text-sm text-orange-100/75">One tap between create and login modes with smart field memories.</p>
            </div>
            <div className="rounded-2xl border border-orange-500/15 bg-black/50 p-4">
              <p className="text-sm font-semibold text-orange-50">Fast paths</p>
              <p className="mt-1 text-sm text-orange-100/75">Inline states, tactile feedback, and focused primary actions.</p>
            </div>
            <div className="rounded-2xl border border-orange-500/15 bg-black/50 p-4">
              <p className="text-sm font-semibold text-orange-50">Session clarity</p>
              <p className="mt-1 text-sm text-orange-100/75">Clear sign-in status with immediate access to dashboard routes.</p>
            </div>
          </div>
          {sessionUser ? (
            <div className="flex flex-col gap-3 rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm text-emerald-50 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-50/80">Signed in</p>
                  <p className="text-lg font-semibold text-emerald-50">{sessionUser.name}</p>
                  <p className="text-emerald-50/80">{sessionUser.email}</p>
                </div>
                <button
                  onClick={signOut}
                  className="rounded-xl border border-emerald-200/40 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:border-emerald-100 hover:bg-emerald-100/10"
                >
                  Sign out
                </button>
              </div>
              <div className="flex items-center justify-between text-emerald-50/80">
                <p>Since {formatDate(sessionUser.createdAt)}</p>
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
                Secure hashing
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-2xl border border-orange-500/15 bg-orange-500/10 p-1 text-sm font-semibold text-orange-50">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 rounded-xl px-3 py-2 transition ${mode === 'create' ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/30' : 'hover:bg-orange-500/20'}`}
              >
                Create Account
              </button>
              <button
                onClick={() => setMode('login')}
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
                    value={createForm.name}
                    onChange={event => setCreateForm({ ...createForm, name: event.target.value })}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
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
                    value={createForm.email}
                    onChange={event => setCreateForm({ ...createForm, email: event.target.value })}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
                    placeholder="you@mindvibe.app"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={event => setCreateForm({ ...createForm, password: event.target.value })}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
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
                  className="w-full rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.01]"
                >
                  Create account
                </button>
                <p className="text-center text-xs text-orange-100/70">
                  We keep credentials local to your device for instant, secure access.
                </p>
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
                    value={loginForm.email}
                    onChange={event => setLoginForm({ ...loginForm, email: event.target.value.toLowerCase() })}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
                    placeholder="you@mindvibe.app"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-orange-50" htmlFor="login-password">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={event => setLoginForm({ ...loginForm, password: event.target.value })}
                    className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-orange-100/75">
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="rounded-lg border border-orange-500/20 px-3 py-2 font-semibold text-orange-50 transition hover:border-orange-400 hover:bg-orange-500/10"
                  >
                    Need an account? Create one
                  </button>
                  <span>Zero-nag login, optimized for speed.</span>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-400/20 transition hover:scale-[1.01]"
                >
                  Sign in securely
                </button>
                <p className="text-center text-xs text-orange-100/70">
                  We verify passwords locally using SHA-256 hashing. Nothing is sent to a server.
                </p>
              </form>
            )}
          </div>
          <div className="rounded-3xl border border-orange-500/15 bg-black/50 p-5 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-[0.18em] text-orange-100/60">Recent accounts</p>
            {accounts.length === 0 ? (
              <p className="mt-3 text-orange-100/70">Your first account will appear here once created.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {accounts
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
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
