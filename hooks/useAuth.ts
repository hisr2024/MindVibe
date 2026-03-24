'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

export interface SignupResult {
  userId: string
  email: string
  emailVerificationSent: boolean
}

interface UseAuthResult {
  user: AuthUser | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  signup: (email: string, password: string, name?: string) => Promise<SignupResult>
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

/**
 * Shallow equality check for AuthUser objects.
 * Prevents unnecessary re-renders when the verified user data hasn't actually changed.
 */
function isUserEqual(a: AuthUser | null, b: AuthUser | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.id === b.id
    && a.email === b.email
    && a.name === b.name
    && a.sessionId === b.sessionId
    && a.subscriptionTier === b.subscriptionTier
    && a.subscriptionStatus === b.subscriptionStatus
    && a.isDeveloper === b.isDeveloper
}

function clearAuthData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_USER_KEY)
  // Clear subscription cache to prevent stale isDeveloper access leaking across accounts
  localStorage.removeItem('mindvibe_subscription')
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

  // Ref to access current user without adding it as a dependency
  const userRef = useRef(user)
  userRef.current = user

  // Stable setUser that skips no-op updates to prevent cascading re-renders
  const setUserIfChanged = useCallback((newUser: AuthUser | null) => {
    if (!isUserEqual(userRef.current, newUser)) {
      setUser(newUser)
    }
  }, [])

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
      setUserIfChanged(storedUser)

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
              isDeveloper: data.is_developer === true,
            }
            // Only update state if user data actually changed — prevents cascading re-renders
            if (!isUserEqual(userRef.current, verifiedUser)) {
              storeUserProfile(verifiedUser)
              setUser(verifiedUser)
            }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signup = useCallback(async (email: string, password: string, name?: string): Promise<SignupResult> => {
    setLoading(true)
    setError(null)

    try {
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
        // Handle FastAPI nested detail: {detail: {detail: "msg", code: "CODE"}}
        const rawSignupDetail = errorData.detail
        const signupDetailObj = typeof rawSignupDetail === 'object' && rawSignupDetail !== null ? rawSignupDetail as Record<string, unknown> : null
        const message = (typeof signupDetailObj?.detail === 'string' ? signupDetailObj.detail : null)
          ?? (typeof rawSignupDetail === 'string' ? rawSignupDetail : null)
          ?? (typeof errorData.message === 'string' ? errorData.message : null)
          ?? 'We\'re having trouble creating your account. Please try again.'
        throw new Error(message)
      }

      const signupData = await signupResponse.json()

      // Do NOT auto-login — user must verify email first
      return {
        userId: signupData.user_id,
        email: signupData.email,
        emailVerificationSent: signupData.email_verification_sent ?? false,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We\'re having trouble creating your account. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
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

        // Backend custom handler normalizes errors to flat: {detail: "msg", code: "CODE"}
        // We also handle nested {detail: {detail: "msg", code: "CODE"}} for robustness.
        const rawDetail = errorData.detail
        const detailObj = typeof rawDetail === 'object' && rawDetail !== null ? rawDetail as Record<string, unknown> : null
        const detail: string = (typeof detailObj?.detail === 'string' ? detailObj.detail : null)
          ?? (typeof rawDetail === 'string' ? rawDetail : '')
        const errorCode: string = (typeof detailObj?.code === 'string' ? detailObj.code : null)
          ?? (typeof errorData.code === 'string' ? errorData.code : '')

        // Handle email not verified — throw specific error for UI to catch
        if (errorCode === 'EMAIL_NOT_VERIFIED' || detail === 'email_not_verified') {
          const err = new Error('email_not_verified')
          ;(err as Error & { code: string }).code = 'EMAIL_NOT_VERIFIED'
          throw err
        }

        const message = detail || errorData.message || 'We couldn\'t verify your credentials. Please check your email and password.'
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
      }

      const data = await response.json()

      // Backend sets httpOnly cookies automatically - we only store profile info
      // Support both new nested user object and legacy flat fields
      const userObj = data.user || {}
      const authUser: AuthUser = {
        id: userObj.id || data.user_id,
        email: userObj.email || data.email,
        name: userObj.name || (userObj.email || data.email || '').split('@')[0],
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
          const newUser = event.newValue ? JSON.parse(event.newValue) as AuthUser : null
          setUserIfChanged(newUser)
        } catch {
          setUser(null)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setUserIfChanged])

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
