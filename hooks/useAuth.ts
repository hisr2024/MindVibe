'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

export interface AuthUser {
  id: string
  email: string
  name?: string
  sessionId?: string
}

interface AuthTokens {
  accessToken: string
  expiresIn: number
  sessionId: string
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

const AUTH_USER_KEY = 'mindvibe_auth_user'
const ACCESS_TOKEN_KEY = 'mindvibe_access_token'
const SESSION_KEY = 'mindvibe_session_id'

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

function storeAuthData(user: AuthUser, tokens: AuthTokens) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(SESSION_KEY, tokens.sessionId)
}

function clearAuthData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  // Also clear legacy session data
  sessionStorage.removeItem('mindvibe_session_user')
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize user from storage on mount
  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)
    setLoading(false)
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

      const signupData = await signupResponse.json()

      // After signup, automatically login to get tokens
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

      const authUser: AuthUser = {
        id: loginData.user_id,
        email: loginData.email,
        name: name || email.split('@')[0],
        sessionId: loginData.session_id,
      }

      const tokens: AuthTokens = {
        accessToken: loginData.access_token,
        expiresIn: loginData.expires_in,
        sessionId: loginData.session_id,
      }

      storeAuthData(authUser, tokens)
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

      const authUser: AuthUser = {
        id: data.user_id,
        email: data.email,
        name: data.email.split('@')[0], // Will be updated from profile
        sessionId: data.session_id,
      }

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        sessionId: data.session_id,
      }

      storeAuthData(authUser, tokens)
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
      const token = getAccessToken()
      if (token) {
        // Call backend logout API
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {
          // Ignore logout API errors - still clear local data
        })
      }
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
      const response = await apiFetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Session refresh failed')
      }

      const data = await response.json()

      // Update stored token
      if (typeof window !== 'undefined' && data.access_token) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)
      }
    } catch (err) {
      // Session refresh failed, user needs to re-login
      clearAuthData()
      setUser(null)
      throw err
    }
  }, [])

  // Listen for storage changes (cross-tab sync)
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
