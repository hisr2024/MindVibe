'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  name?: string
  sessionId?: string
  subscriptionTier?: string
  subscriptionStatus?: string
  isDeveloper?: boolean
}

interface UseAuthResult {
  user: AuthUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string, twoFactorCode?: string) => Promise<AuthUser>
  signup: (email: string, password: string, name?: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  backendReady: boolean
}

// Only store non-sensitive user profile data in localStorage (no tokens!)
const AUTH_USER_KEY = 'mindvibe_auth_user'

// Shared refresh promise to prevent concurrent refresh token requests.
// If multiple components detect a 401 and call refreshSession() simultaneously,
// only the first one makes the actual request; others await the same promise.
let refreshPromise: Promise<void> | null = null

function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(AUTH_USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    return null
  }
}

function storeUserProfile(user: AuthUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

function clearAuthData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_USER_KEY)
  // Clear any legacy token storage from previous versions
  localStorage.removeItem('mindvibe_access_token')
  localStorage.removeItem('access_token')
  localStorage.removeItem('mindvibe_session_id')
  sessionStorage.removeItem('mindvibe_session_user')
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [backendReady, setBackendReady] = useState(false)

  // Warm up the backend on mount (Render free tier cold starts take 30-60s).
  // This is non-blocking: the user can sign in at any time.  The proxy layer
  // has its own retry logic for 503s during cold starts.  We poll /api/health
  // to update the informational banner and to prime the backend connection.
  useEffect(() => {
    let cancelled = false
    const warmUp = async () => {
      const maxAttempts = 5
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const res = await fetch('/api/health', {
            signal: AbortSignal.timeout(10000),
          })
          if (cancelled) return
          const data = await res.json().catch(() => ({ ready: false }))
          if (data.ready) {
            setBackendReady(true)
            return
          }
        } catch {
          // Timeout or network error - keep retrying
        }
        if (cancelled) return
        if (attempt < maxAttempts - 1) {
          const delay = Math.min(3000 * Math.pow(2, attempt), 15000)
          await new Promise(r => setTimeout(r, delay))
        }
      }
      // After all attempts, mark ready anyway (proxy handles retries)
      if (!cancelled) setBackendReady(true)
    }
    warmUp()
    return () => { cancelled = true }
  }, [])

  // Initialize: check stored profile, then verify session with backend
  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)

      // Only verify session if there's a stored user profile.
      // If no user ever logged in, there's no httpOnly session cookie
      // to verify, so skip the /api/auth/me call to avoid 401 console noise.
      apiFetch('/api/auth/me')
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json()
            const verifiedUser: AuthUser = {
              id: data.user_id,
              email: data.email,
              name: storedUser?.name || data.email.split('@')[0],
              sessionId: data.session_id,
              subscriptionTier: data.subscription_tier || storedUser?.subscriptionTier || 'free',
              subscriptionStatus: data.subscription_status || storedUser?.subscriptionStatus || 'active',
              isDeveloper: data.is_developer || storedUser?.isDeveloper || false,
            }
            storeUserProfile(verifiedUser)
            setUser(verifiedUser)
          } else {
            // Session invalid - clear stored data
            clearAuthData()
            setUser(null)
          }
        })
        .catch(() => {
          // Network error - keep stored user for offline display
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // No stored user = not logged in, skip server verification
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, name?: string): Promise<AuthUser> => {
    setLoading(true)
    setError(null)

    try {
      // The proxy layer handles 503 retries with exponential backoff,
      // so we make a single request and let the server-side proxy absorb cold starts.
      let signupResponse: Response

      try {
        signupResponse = await apiFetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        })
      } catch {
        throw new Error('Unable to reach the server. Please check your connection and try again.')
      }

      if (!signupResponse.ok) {
        if (signupResponse.status === 503) {
          throw new Error('The server is still starting up. Please wait a moment and try again.')
        }
        const errorData = await signupResponse.json().catch(() => ({}))
        const message = errorData.detail || errorData.message || 'We\'re having trouble creating your account. Please try again.'
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
      }

      // After signup, automatically login to get session cookies
      let loginResponse: Response
      try {
        loginResponse = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase(), password }),
        })
      } catch {
        throw new Error('Account created but could not sign in automatically. Please try signing in.')
      }

      if (!loginResponse.ok) {
        if (loginResponse.status === 503) {
          throw new Error('Account created but server is starting up. Please try signing in shortly.')
        }
        const errorData = await loginResponse.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Account created but login failed. Please try logging in.')
      }

      const loginData = await loginResponse.json()

      // Backend sets httpOnly cookies automatically - we only store profile info
      const authUser: AuthUser = {
        id: loginData.user_id,
        email: loginData.email,
        name: name || email.split('@')[0],
        sessionId: loginData.session_id,
        subscriptionTier: loginData.subscription_tier || 'free',
        subscriptionStatus: loginData.subscription_status || 'active',
        isDeveloper: loginData.is_developer || false,
      }

      storeUserProfile(authUser)
      setUser(authUser)

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: authUser } }))

      return authUser
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We\'re having trouble creating your account. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string, twoFactorCode?: string): Promise<AuthUser> => {
    setLoading(true)
    setError(null)

    try {
      // The proxy layer handles 503 retries with exponential backoff,
      // so we make a single request and let the server-side proxy absorb cold starts.
      let response: Response

      try {
        response = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.toLowerCase(),
            password,
            two_factor_code: twoFactorCode || null,
          }),
        })
      } catch {
        throw new Error('Unable to reach the server. Please check your connection and try again.')
      }

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('The server is still starting up. Please wait a moment and try again.')
        }
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.detail || errorData.message || 'We couldn\'t verify your credentials. Please check your email and password.'
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
      }

      const data = await response.json()

      // Backend sets httpOnly cookies automatically - we only store profile info
      const authUser: AuthUser = {
        id: data.user_id,
        email: data.email,
        name: data.email.split('@')[0],
        sessionId: data.session_id,
        subscriptionTier: data.subscription_tier || 'free',
        subscriptionStatus: data.subscription_status || 'active',
        isDeveloper: data.is_developer || false,
      }

      storeUserProfile(authUser)
      setUser(authUser)

      // Dispatch event for other components (subscription hook listens to this)
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: authUser } }))

      return authUser
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We\'re having trouble signing you in. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Call backend logout API - httpOnly cookies sent automatically
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      }).catch(() => {
        // Ignore logout API errors - still clear local data
      })
    } finally {
      clearAuthData()
      setUser(null)
      setLoading(false)

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: null } }))
    }
  }, [])

  const refreshSession = useCallback(async () => {
    // If a refresh is already in flight, reuse it to prevent race conditions.
    // Multiple concurrent 401s all share the same refresh request.
    if (refreshPromise) {
      return refreshPromise
    }

    refreshPromise = (async () => {
      try {
        // httpOnly refresh_token cookie is sent automatically
        const response = await apiFetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Session refresh failed')
        }
        // Backend sets new httpOnly access_token cookie automatically
      } catch (err) {
        // Session refresh failed, user needs to re-login
        clearAuthData()
        setUser(null)
        throw err
      } finally {
        refreshPromise = null
      }
    })()

    return refreshPromise
  }, [])

  // Listen for storage changes (cross-tab sync of user profile)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_USER_KEY) {
        try {
          const newUser = event.newValue ? JSON.parse(event.newValue) : null
          setUser(newUser)
        } catch {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshSession,
    backendReady,
  }
}

export default useAuth
