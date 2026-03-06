/**
 * Admin API fetch utility.
 *
 * Wraps apiFetch to include the admin Bearer token from sessionStorage.
 * Admin endpoints require Authorization: Bearer <token> header
 * (unlike user auth which uses httpOnly cookies).
 */

import { apiFetch } from '@/lib/api'

const ADMIN_TOKEN_KEY = 'mindvibe_admin_token'
const ADMIN_SESSION_KEY = 'mindvibe_admin_session'

export interface AdminSession {
  adminId: string
  email: string
  fullName: string
  role: string
  sessionId: string
  expiresIn: number
  loginAt: string
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem(ADMIN_SESSION_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AdminSession
  } catch {
    return null
  }
}

export function isAdminAuthenticated(): boolean {
  return getAdminToken() !== null
}

export function clearAdminAuth(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(ADMIN_TOKEN_KEY)
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
}

/**
 * Fetch wrapper for admin API endpoints.
 * Automatically includes the admin Bearer token in the Authorization header.
 */
export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken()
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return apiFetch(path, {
    ...options,
    headers,
  })
}

/**
 * Logout admin session and clear stored credentials.
 */
export async function adminLogout(): Promise<void> {
  try {
    await adminFetch('/api/admin/auth/logout', { method: 'POST' })
  } catch {
    // Ignore logout API errors - still clear local data
  } finally {
    clearAdminAuth()
  }
}
