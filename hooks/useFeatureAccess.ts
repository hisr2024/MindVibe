'use client'

import { useMemo } from 'react'
import { useSubscription } from './useSubscription'

/**
 * Feature access definitions by tier.
 *
 * Mirrors backend/config/feature_config.py — keep in sync when tiers change.
 * Tiers are ordered: free < basic < premium < enterprise < premier
 */

type TierId = 'free' | 'basic' | 'premium' | 'enterprise' | 'premier'

const TIER_RANK: Record<TierId, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
  premier: 4,
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

/** KIAAN question quotas by tier (-1 = unlimited) */
const TIER_QUOTAS: Record<TierId, number> = {
  free: 15,
  basic: 150,      // Plus
  premium: 300,    // Pro
  enterprise: 800, // Elite
  premier: -1,     // Premier — unlimited
}

/** Wisdom Journey limits by tier (-1 = unlimited) */
const JOURNEY_LIMITS: Record<TierId, number> = {
  free: 1,
  basic: 3,
  premium: 10,
  enterprise: -1,  // Elite — unlimited
  premier: -1,     // Premier — unlimited
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
  /** Whether the user has developer access (all features unlocked) */
  isDeveloper: boolean
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

  const isDeveloper = subscription?.isDeveloper ?? false
  const tier = (subscription?.tierId ?? 'free') as TierId
  const tierRank = TIER_RANK[tier] ?? 0

  return useMemo(() => {
    const hasAccess = (feature: string): boolean => {
      if (isDeveloper) return true
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
      isPaid: isDeveloper || tierRank >= TIER_RANK.basic,
      isPremium: isDeveloper || tierRank >= TIER_RANK.premium,
      kiaanQuota: isDeveloper ? -1 : (TIER_QUOTAS[tier] ?? 50),
      isKiaanUnlimited: isDeveloper || (TIER_QUOTAS[tier] ?? 50) === -1,
      journeyLimit: isDeveloper ? -1 : (JOURNEY_LIMITS[tier] ?? 1),
      isDeveloper,
      loading,
    }
  }, [tier, tierRank, isDeveloper, loading])
}

export default useFeatureAccess
