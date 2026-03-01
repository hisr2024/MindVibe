'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiFetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          mfa_code: mfaCode || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed')
      }

      if (data.mfa_required) {
        setMfaRequired(true)
        setLoading(false)
        return
      }

      // Backend sets httpOnly cookies automatically - no localStorage token storage
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a44c] to-[#e8b54a]">
              <span className="text-2xl font-bold text-slate-900">MV</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-400">
              {mfaRequired
                ? 'Enter your MFA code to continue'
                : 'Sign in to Sakha Admin Panel'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
              <p id="login-error" className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!mfaRequired ? (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
                    placeholder="admin@kiaanverse.com"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-100 placeholder-slate-400 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
                    placeholder="••••••••"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </>
            ) : (
              <div>
                <label
                  htmlFor="mfa"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  MFA Code
                </label>
                <input
                  id="mfa"
                  type="text"
                  autoComplete="one-time-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  minLength={6}
                  maxLength={8}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-100 placeholder-slate-400 focus:border-[#d4a44c] focus:outline-none focus:ring-1 focus:ring-[#d4a44c]"
                  placeholder="000000"
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-400">
                  Enter the code from your authenticator app
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#d4a44c] to-[#d4a44c] px-4 py-3 font-semibold text-slate-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <span>Signing in...</span> : mfaRequired ? <span>Verify</span> : <span>Sign In</span>}
            </button>
          </form>

          {mfaRequired && (
            <button
              onClick={() => {
                setMfaRequired(false)
                setMfaCode('')
              }}
              className="mt-4 w-full text-sm text-slate-400 hover:text-slate-300"
            >
              ← Back to login
            </button>
          )}

          {/* Security Notice */}
          <div className="mt-8 rounded-lg bg-slate-700/30 p-4">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Security Notice:</strong> All admin
              actions are logged. Sessions expire after 1 hour of inactivity.
              MFA is required for all admin accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
