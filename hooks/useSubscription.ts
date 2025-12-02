'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Subscription {
  id: string
  tierId: string
  tierName: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  isYearly: boolean
}

interface UseSubscriptionResult {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const SUBSCRIPTION_STORAGE_KEY = 'mindvibe_subscription'

export function useSubscription(): UseSubscriptionResult {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, this would be an API call
      // For now, we'll use localStorage to simulate
      const stored = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY)
      
      if (stored) {
        setSubscription(JSON.parse(stored))
      } else {
        // Default to free tier
        const freeTier: Subscription = {
          id: 'free-default',
          tierId: 'free',
          tierName: 'Free',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          isYearly: false,
        }
        setSubscription(freeTier)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
  }
}

export function updateSubscription(subscription: Subscription) {
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription))
  window.dispatchEvent(new Event('subscription-updated'))
}

export default useSubscription
