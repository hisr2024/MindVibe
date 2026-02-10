/**
 * Onboarding Service
 * API integration for onboarding flow
 */

import { apiFetch } from '@/lib/api'
import type {
  OnboardingState,
  OnboardingProgress,
  SubscriptionTier,
} from '@/types/onboarding.types'

const ONBOARDING_STORAGE_KEY = 'mindvibe_onboarding_progress'

/**
 * Save onboarding progress to backend
 * Falls back to localStorage if API fails
 */
export async function saveOnboardingProgress(
  data: Partial<OnboardingState>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to localStorage as backup
    const existing = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    const parsed = existing ? JSON.parse(existing) : {}
    const merged = { ...parsed, ...data, lastUpdated: new Date().toISOString() }
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(merged))

    // Try to save to backend (auth via httpOnly cookies)
    try {
      const response = await apiFetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: merged }),
      })

      if (!response.ok) {
        // Log error but don't fail since we have localStorage backup
        console.warn('Failed to save onboarding progress to backend')
      }
    } catch {
      // Backend save failed, localStorage backup is sufficient
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving onboarding progress:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save progress',
    }
  }
}

/**
 * Get onboarding progress from backend or localStorage
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress | null> {
  try {
    // Try to get from backend first (auth via httpOnly cookies)
    try {
      const response = await apiFetch('/api/onboarding/progress', {
        method: 'GET',
      })

      if (response.ok) {
        const data = await response.json()
        if (data) return data
      }
    } catch {
      // Backend unavailable, fall through to localStorage
    }

    // Fall back to localStorage
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        userId: 'local',
        currentStep: parsed.currentStep || 0,
        isComplete: parsed.isComplete || false,
        data: parsed,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      }
    }

    return null
  } catch (error) {
    console.error('Error getting onboarding progress:', error)
    return null
  }
}

/**
 * Mark onboarding as complete and save final data
 */
export async function completeOnboarding(
  data: OnboardingState,
): Promise<{ success: boolean; error?: string }> {
  try {
    const completeData: OnboardingState = {
      ...data,
      isComplete: true,
      completedAt: new Date().toISOString(),
    }

    // Save to localStorage
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(completeData))
    localStorage.setItem('mindvibe_onboarding_complete', 'true')

    // Save profile data separately for easy access
    localStorage.setItem('mindvibe_profile', JSON.stringify(completeData.profile))
    localStorage.setItem('mindvibe_preferences', JSON.stringify(completeData.preferences))

    // Try to save to backend (auth via httpOnly cookies)
    try {
      const response = await apiFetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
      })

      if (!response.ok) {
        console.warn('Failed to complete onboarding on backend')
      }
    } catch {
      // Backend save failed, localStorage backup is sufficient
    }

    return { success: true }
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding',
    }
  }
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('mindvibe_onboarding_complete') === 'true'
}

/**
 * Get subscription tiers from backend or return defaults
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const response = await apiFetch('/api/subscriptions/tiers', {
      method: 'GET',
    })

    if (response.ok) {
      const data = await response.json()
      if (data.tiers) return data.tiers
    }
  } catch (error) {
    console.warn('Failed to fetch subscription tiers, using defaults:', error)
  }

  // Return default tiers
  return getDefaultSubscriptionTiers()
}

/**
 * Default subscription tiers
 */
export function getDefaultSubscriptionTiers(): SubscriptionTier[] {
  return [
    {
      id: 'free',
      name: 'Free',
      description: 'Get started with 20 KIAAN questions/month',
      monthlyPrice: 0,
      yearlyPrice: 0,
      kiaanQuota: 20,
      features: [
        { name: 'KIAAN conversations', included: true, limit: '20/month' },
        { name: 'Journal & mood tracking', included: true },
        { name: 'Daily wisdom', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Data export (CSV)', included: true },
        { name: 'Priority support', included: false },
        { name: 'Advanced insights', included: false },
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'More questions and extra features',
      monthlyPrice: 9,
      yearlyPrice: 89,
      kiaanQuota: 50,
      features: [
        { name: 'KIAAN conversations', included: true, limit: '50/month' },
        { name: 'Journal & mood tracking', included: true },
        { name: 'Daily wisdom', included: true },
        { name: 'Full analytics', included: true },
        { name: 'Data export (all formats)', included: true },
        { name: 'Email support', included: true },
        { name: 'Advanced insights', included: false },
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Full access to everything',
      monthlyPrice: 19,
      yearlyPrice: 189,
      kiaanQuota: 300,
      isPopular: true,
      badge: 'Best Value',
      features: [
        { name: 'KIAAN conversations', included: true, limit: '300/month' },
        { name: 'Journal & mood tracking', included: true },
        { name: 'Daily wisdom', included: true },
        { name: 'Full analytics', included: true },
        { name: 'Data export (all formats)', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced AI insights', included: true },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Unlimited access for teams',
      monthlyPrice: 49,
      yearlyPrice: 489,
      kiaanQuota: 'unlimited',
      badge: 'Teams',
      features: [
        { name: 'KIAAN conversations', included: true, limit: 'Unlimited' },
        { name: 'Journal & mood tracking', included: true },
        { name: 'Daily wisdom', included: true },
        { name: 'Full analytics', included: true },
        { name: 'Data export (all formats)', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'Advanced AI insights', included: true },
        { name: 'Team management', included: true },
        { name: 'Custom integrations', included: true },
      ],
    },
  ]
}

/**
 * Clear onboarding progress (for testing/reset)
 */
export function clearOnboardingProgress(): void {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  localStorage.removeItem('mindvibe_onboarding_complete')
  localStorage.removeItem('mindvibe_profile')
  localStorage.removeItem('mindvibe_preferences')
}
