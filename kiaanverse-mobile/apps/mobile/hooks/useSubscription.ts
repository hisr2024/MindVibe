/**
 * useSubscription — Feature gating hook for KIAAN subscriptions
 *
 * Provides the canonical interface for checking subscription-gated features.
 * Wraps the subscriptionStore with convenient boolean accessors.
 *
 * 4-tier model aligned with backend (March 2026):
 * - free (Seeker): 5 KIAAN questions/month
 * - bhakta: 50 questions/month
 * - sadhak: 300 questions/month, all features
 * - siddha: Unlimited everything
 *
 * Usage:
 *   const { canUseVoice, canSendMessage, tier } = useSubscription()
 *   if (!canUseVoice) { router.push('/subscription'); return }
 */

import { useMemo } from 'react';
import { useSubscriptionStore, type SubscriptionTier } from '@kiaanverse/store';

export interface UseSubscriptionResult {
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Whether the subscription store has been hydrated */
  isReady: boolean;
  /** Whether user is on a paid plan */
  isPaid: boolean;
  /** Whether the user can send a KIAAN question (respects monthly quota) */
  canSendMessage: boolean;
  /** Whether the user can use voice mode (Sadhak+) */
  canUseVoice: boolean;
  /** Whether the user has access to encrypted journal (Bhakta+) */
  hasEncryptedJournal: boolean;
  /** Whether the user has access to advanced analytics (Sadhak+) */
  hasAdvancedAnalytics: boolean;
  /** Whether the user has access to KIAAN Agent (Sadhak+) */
  hasKiaanAgent: boolean;
  /** Whether the user has dedicated support (Siddha only) */
  hasDedicatedSupport: boolean;
  /** Whether the user has team features (Siddha only) */
  hasTeamFeatures: boolean;
  /** Remaining KIAAN questions this month (-1 = unlimited) */
  kiaanRemaining: number;
  /** Monthly KIAAN question limit (-1 = unlimited) */
  kiaanLimit: number;
  /** Questions used this month */
  kiaanUsed: number;
  /** Subscription expiry date */
  expiresAt: string | null;
  /** Check if user can start a new journey */
  canStartJourney: (currentCount: number) => boolean;
  /** Check access for a named feature */
  hasFeature: (feature: string) => boolean;
  /** Purchase flow status */
  purchaseStatus: string;
  /** Purchase error message */
  error: string | null;
}

/** Monthly KIAAN question limits per tier (-1 = unlimited) */
const MONTHLY_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  bhakta: 50,
  sadhak: 300,
  siddha: -1,
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  bhakta: 1,
  sadhak: 2,
  siddha: 3,
};

export function useSubscription(): UseSubscriptionResult {
  const tier = useSubscriptionStore((s) => s.tier);
  const isHydrated = useSubscriptionStore((s) => s.isHydrated);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const monthlyKiaanCount = useSubscriptionStore((s) => s.monthlyKiaanCount);
  const purchaseStatus = useSubscriptionStore((s) => s.purchaseStatus);
  const error = useSubscriptionStore((s) => s.error);
  const canSendMessageFn = useSubscriptionStore((s) => s.canSendMessage);
  const canUseVoiceFn = useSubscriptionStore((s) => s.canUseVoice);
  const canStartJourneyFn = useSubscriptionStore((s) => s.canStartJourney);
  const hasFeatureFn = useSubscriptionStore((s) => s.hasFeature);

  const limit = MONTHLY_LIMITS[tier];
  const rank = TIER_RANK[tier];

  return useMemo(() => ({
    tier,
    isReady: isHydrated,
    isPaid: tier !== 'free',
    canSendMessage: canSendMessageFn(),
    canUseVoice: canUseVoiceFn(),
    hasEncryptedJournal: rank >= TIER_RANK.bhakta,
    hasAdvancedAnalytics: rank >= TIER_RANK.sadhak,
    hasKiaanAgent: rank >= TIER_RANK.sadhak,
    hasDedicatedSupport: rank >= TIER_RANK.siddha,
    hasTeamFeatures: rank >= TIER_RANK.siddha,
    kiaanRemaining: limit === -1 ? -1 : Math.max(0, limit - monthlyKiaanCount),
    kiaanLimit: limit,
    kiaanUsed: monthlyKiaanCount,
    expiresAt,
    canStartJourney: canStartJourneyFn,
    hasFeature: hasFeatureFn,
    purchaseStatus,
    error,
  }), [tier, isHydrated, expiresAt, monthlyKiaanCount, limit, rank, purchaseStatus, error, canSendMessageFn, canUseVoiceFn, canStartJourneyFn, hasFeatureFn]);
}

export default useSubscription;
