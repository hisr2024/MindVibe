'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api'

export interface Subscription {
  id: string
  tierId: string
  tierName: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'expired'
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  isYearly: boolean
  isDeveloper: boolean
}

interface UseSubscriptionResult {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const SUBSCRIPTION_STORAGE_KEY = 'mindvibe_subscription'
const AUTH_USER_KEY = 'mindvibe_auth_user'

interface ApiSubscriptionPlan {
  id: number | string
  tier: string
  name: string
  description?: string | null
  price_monthly?: number | string | null
  price_yearly?: number | string | null
}

interface ApiSubscription {
  id: number | string
  plan: ApiSubscriptionPlan
  status?: string
  current_period_end?: string | null
  cancel_at_period_end?: boolean
  is_developer?: boolean
  effective_tier?: string | null
}

function getDefaultSubscription(): Subscription {
  return {
    id: 'free-default',
    tierId: 'free',
    tierName: 'Free',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    isYearly: false,
    isDeveloper: false,
  }
}

function persistSubscription(subscription: Subscription) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription)) } catch { /* Private browsing */ }
}

/**
 * Shallow equality check for Subscription objects.
 * Prevents unnecessary re-renders when subscription data hasn't changed.
 */
function isSubscriptionEqual(a: Subscription | null, b: Subscription | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.id === b.id
    && a.tierId === b.tierId
    && a.tierName === b.tierName
    && a.status === b.status
    && a.currentPeriodEnd === b.currentPeriodEnd
    && a.cancelAtPeriodEnd === b.cancelAtPeriodEnd
    && a.isYearly === b.isYearly
    && a.isDeveloper === b.isDeveloper
}

function getCachedSubscription(): Subscription {
  if (typeof window === 'undefined') return getDefaultSubscription()

  let stored: string | null = null
  try { stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY) } catch { /* Private browsing */ }
  if (!stored) return getDefaultSubscription()

  try {
    return JSON.parse(stored) as Subscription
  } catch (error) {
    console.warn('Failed to parse cached subscription', error)
    return getDefaultSubscription()
  }
}

/**
 * Check if a user profile exists in localStorage.
 * If no profile is stored, the user has never logged in and there's no session cookie,
 * so API calls requiring authentication will fail with 401.
 */
function isUserLikelyAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_USER_KEY) !== null
}

async function fetchSubscriptionFromApi(): Promise<Subscription> {
  const response = await apiFetch('/api/subscriptions/current', {
    method: 'GET',
  })

  // Handle 401 gracefully — user's session expired or they're not logged in
  if (response.status === 401) {
    return getDefaultSubscription()
  }

  // Handle 404 gracefully — user account not found, return default free subscription
  if (response.status === 404) {
    return getDefaultSubscription()
  }

  // Handle 500 gracefully — server error, fall back to cached or default subscription
  if (response.status === 500) {
    throw new Error('Failed to fetch subscription from API')
  }

  if (!response.ok) {
    throw new Error('Failed to fetch subscription from API')
  }

  const data = (await response.json()) as ApiSubscription

  const currentPeriodEnd = data.current_period_end
    ? new Date(data.current_period_end).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const isDeveloper = Boolean(data.is_developer)

  const subscription: Subscription = {
    id: String(data.id ?? 'free-default'),
    tierId: data.effective_tier ?? data.plan?.tier ?? 'free',
    tierName: data.plan?.name ?? 'Free',
    status: (data.status as Subscription['status']) ?? 'active',
    currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
    isYearly: Boolean(data.plan?.price_yearly && !data.plan?.price_monthly),
    isDeveloper,
  }

  persistSubscription(subscription)
  return subscription
}

export async function cancelSubscription(): Promise<void> {
  const response = await apiFetch('/api/subscriptions/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancel_immediately: false }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message =
      (errorBody && errorBody.message) ||
      (typeof errorBody === 'string' ? errorBody : 'Failed to cancel subscription')
    throw new Error(message)
  }
}

export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const subscriptionRef = useRef(subscription)
  subscriptionRef.current = subscription

  // Debounce ref to coalesce rapid event-driven fetches
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Skip API call for unauthenticated users — avoids 401 console errors
    if (!isUserLikelyAuthenticated()) {
      const defaultSub = getDefaultSubscription()
      if (mountedRef.current && !isSubscriptionEqual(subscriptionRef.current, defaultSub)) {
        setSubscription(defaultSub)
      }
      if (mountedRef.current) setLoading(false)
      return
    }

    try {
      const latest = await fetchSubscriptionFromApi()
      // Only update state if subscription data actually changed
      if (mountedRef.current && !isSubscriptionEqual(subscriptionRef.current, latest)) {
        setSubscription(latest)
      }
    } catch (err) {
      if (!mountedRef.current) return
      console.warn('Falling back to cached subscription', err)
      const cached = getCachedSubscription()
      // Never trust developer status from cache — it must come from the server.
      // A stale isDeveloper:true would grant full access to non-developer users.
      cached.isDeveloper = false
      if (!isSubscriptionEqual(subscriptionRef.current, cached)) {
        setSubscription(cached)
      }
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    fetchSubscription()
    return () => { mountedRef.current = false }
  }, [fetchSubscription])

  useEffect(() => {
    // Debounced fetch — coalesces rapid events (auth-changed + storage + subscription-updated)
    // into a single API call after 300ms of quiet.
    const debouncedFetch = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (mountedRef.current) fetchSubscription()
      }, 300)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SUBSCRIPTION_STORAGE_KEY || event.key === AUTH_USER_KEY) {
        debouncedFetch()
      }
    }

    window.addEventListener('subscription-updated', debouncedFetch)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('auth-changed', debouncedFetch)

    return () => {
      clearTimeout(debounceRef.current)
      window.removeEventListener('subscription-updated', debouncedFetch)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('auth-changed', debouncedFetch)
    }
  }, [fetchSubscription])

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
  }
}

export function updateSubscription(subscription: Subscription) {
  const cached = getCachedSubscription()
  // Never inherit isDeveloper from the cache — only use the explicit value from the update.
  // This prevents stale developer access from leaking across user sessions.
  const merged = { ...cached, ...subscription, isDeveloper: subscription.isDeveloper ?? false }
  persistSubscription(merged)
  window.dispatchEvent(new Event('subscription-updated'))
}

export default useSubscription
