'use client'

import { useMemo } from 'react'
import { useSubscription } from './useSubscription'

/**
 * Feature access definitions by tier.
 *
 * Mirrors backend/config/feature_config.py — keep in sync when tiers change.
 * Tiers are ordered: free < basic < premium
 */

type TierId = 'free' | 'basic' | 'premium'

const TIER_RANK: Record<TierId, number> = {
  free: 0,
  basic: 1,
  premium: 2,
}

interface FeatureDef {
  /** Minimum tier required */
  minTier: TierId
  /** Human-readable label shown in upsell prompts */
  label: string
}

/**
 * All gated features and the minimum tier needed to access them.
 */
const FEATURE_MAP: Record<string, FeatureDef> = {
  encrypted_journal: { minTier: 'basic', label: 'Encrypted Journal' },
  voice_synthesis: { minTier: 'basic', label: 'Voice Synthesis' },
  wisdom_journeys_full: { minTier: 'basic', label: 'Full Wisdom Journeys' },
  ardha_reframing: { minTier: 'basic', label: 'Ardha Cognitive Reframing' },
  viyoga_detachment: { minTier: 'basic', label: 'Viyoga Detachment Coach' },
  voice_companion: { minTier: 'premium', label: 'Voice Companion' },
  soul_reading: { minTier: 'premium', label: 'Soul Reading' },
  quantum_dive: { minTier: 'premium', label: 'Quantum Dive' },
  kiaan_agent: { minTier: 'premium', label: 'KIAAN Agent' },
  relationship_compass: { minTier: 'premium', label: 'Relationship Compass' },
  advanced_analytics: { minTier: 'premium', label: 'Advanced Analytics' },
  priority_support: { minTier: 'premium', label: 'Priority Support' },
  offline_access: { minTier: 'premium', label: 'Offline Access' },
}

/** KIAAN question quotas by tier */
const TIER_QUOTAS: Record<TierId, number> = {
  free: 15,
  basic: 150,    // Plus
  premium: 300,  // Pro
}

/** Wisdom Journey limits by tier */
const JOURNEY_LIMITS: Record<TierId, number> = {
  free: 1,
  basic: 3,
  premium: 10,
}

export interface FeatureAccessResult {
  /** Current subscription tier */
  tier: TierId
  /** Check if a specific feature is available on the current tier */
  hasAccess: (feature: string) => boolean
  /** Get the minimum tier required for a feature */
  requiredTier: (feature: string) => TierId
  /** Get the human-readable label for a gated feature */
  featureLabel: (feature: string) => string
  /** Whether the user is on a paid plan */
  isPaid: boolean
  /** Whether the user is on the top individual plan */
  isPremium: boolean
  /** Monthly KIAAN question quota (-1 = unlimited) */
  kiaanQuota: number
  /** Whether KIAAN questions are unlimited on this tier */
  isKiaanUnlimited: boolean
  /** Max active Wisdom Journeys (-1 = unlimited) */
  journeyLimit: number
  /** Subscription loading state */
  loading: boolean
}

/**
 * Hook that provides client-side feature access checks based on subscription tier.
 *
 * Usage:
 *   const { hasAccess, requiredTier, isPaid } = useFeatureAccess()
 *   if (!hasAccess('voice_companion')) { show upgrade prompt }
 */
export function useFeatureAccess(): FeatureAccessResult {
  const { subscription, loading } = useSubscription()

  const tier = (subscription?.tierId ?? 'free') as TierId
  const tierRank = TIER_RANK[tier] ?? 0

  return useMemo(() => {
    const hasAccess = (feature: string): boolean => {
      const def = FEATURE_MAP[feature]
      if (!def) return true // unknown features are unrestricted
      return tierRank >= TIER_RANK[def.minTier]
    }

    const requiredTier = (feature: string): TierId => {
      return FEATURE_MAP[feature]?.minTier ?? 'free'
    }

    const featureLabel = (feature: string): string => {
      return FEATURE_MAP[feature]?.label ?? feature
    }

    return {
      tier,
      hasAccess,
      requiredTier,
      featureLabel,
      isPaid: tierRank >= TIER_RANK.basic,
      isPremium: tierRank >= TIER_RANK.premium,
      kiaanQuota: TIER_QUOTAS[tier] ?? 50,
      isKiaanUnlimited: (TIER_QUOTAS[tier] ?? 50) === -1,
      journeyLimit: JOURNEY_LIMITS[tier] ?? 1,
      loading,
    }
  }, [tier, tierRank, loading])
}

export default useFeatureAccess
