/**
 * Feature Gating — Controls access to features by subscription tier
 *
 * Used by both frontend (UI gating) and API middleware (access control).
 * Seeker = free tier, Pro = paid, Circle = family plan.
 */

export type SubscriptionTier = 'seeker' | 'pro' | 'circle'

export const FEATURE_GATES: Record<string, SubscriptionTier[]> = {
  // Pro + Circle features
  sakha_unlimited:      ['pro', 'circle'],
  voice_companion:      ['pro', 'circle'],
  shadripu_journeys:    ['pro', 'circle'],
  karma_reset:          ['pro', 'circle'],
  emotional_reset:      ['pro', 'circle'],
  viyoga:               ['pro', 'circle'],
  ardha:                ['pro', 'circle'],
  compass:              ['pro', 'circle'],
  vibe_player:          ['pro', 'circle'],
  deep_memory:          ['pro', 'circle'],

  // Circle-only features
  family_members:       ['circle'],
  family_dashboard:     ['circle'],
  children_stories:     ['circle'],

  // Free features (all tiers)
  daily_shloka:         ['seeker', 'pro', 'circle'],
  sadhana_limited:      ['seeker', 'pro', 'circle'],
  sakha_limited:        ['seeker', 'pro', 'circle'],
}

/**
 * Check if a subscription tier has access to a feature.
 */
export function hasAccess(userTier: SubscriptionTier, feature: string): boolean {
  const allowedTiers = FEATURE_GATES[feature]
  if (!allowedTiers) return false
  return allowedTiers.includes(userTier)
}

/**
 * Get the minimum tier required for a feature.
 */
export function getRequiredTier(feature: string): SubscriptionTier | null {
  const tiers = FEATURE_GATES[feature]
  if (!tiers || tiers.length === 0) return null
  if (tiers.includes('seeker')) return 'seeker'
  if (tiers.includes('pro')) return 'pro'
  return 'circle'
}
