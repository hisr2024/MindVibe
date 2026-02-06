'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  name?: string
  sessionId?: string
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
}

// Only store non-sensitive user profile data in localStorage (no tokens!)
const AUTH_USER_KEY = 'mindvibe_auth_user'

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

  // Initialize: check stored profile, then verify session with backend
  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }

    // Verify session is still valid via httpOnly cookie
    apiFetch('/api/auth/me')
      .then(async (response) => {
        if (response.ok) {
          const data = await response.json()
          const verifiedUser: AuthUser = {
            id: data.user_id,
            email: data.email,
            name: storedUser?.name || data.email.split('@')[0],
            sessionId: data.session_id,
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
  }, [])

  const signup = useCallback(async (email: string, password: string, name?: string): Promise<AuthUser> => {
    setLoading(true)
    setError(null)

    try {
      // Call backend signup API
      const signupResponse = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      })

      if (!signupResponse.ok) {
        const errorData = await signupResponse.json().catch(() => ({}))
        const message = errorData.detail || errorData.message || 'Failed to create account'
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
      }

      // After signup, automatically login to get session cookies
      const loginResponse = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      })

      if (!loginResponse.ok) {
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
      }

      storeUserProfile(authUser)
      setUser(authUser)

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: authUser } }))

      return authUser
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account'
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
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          two_factor_code: twoFactorCode || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.detail || errorData.message || 'Invalid credentials'
        throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
      }

      const data = await response.json()

      // Backend sets httpOnly cookies automatically - we only store profile info
      const authUser: AuthUser = {
        id: data.user_id,
        email: data.email,
        name: data.email.split('@')[0],
        sessionId: data.session_id,
      }

      storeUserProfile(authUser)
      setUser(authUser)

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('auth-changed', { detail: { user: authUser } }))

      return authUser
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
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
    }
  }, [])

  // Listen for storage changes (cross-tab sync of user profile)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_USER_KEY) {
        const newUser = event.newValue ? JSON.parse(event.newValue) : null
        setUser(newUser)
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
  }
}

export default useAuth
