/**
 * useSubscription — Feature gating hook for KIAAN Vibe Player
 *
 * Provides the canonical interface for checking subscription-gated features.
 * Wraps the subscriptionStore with convenient boolean accessors.
 *
 * Usage:
 *   const { canUseVoice, canSendMessage, tier } = useSubscription()
 *   if (!canUseVoice) { router.push('/subscription'); return }
 */

import { useCallback, useMemo } from 'react';
import { useSubscriptionStore, type VibePlayerTier } from '@kiaanverse/store';

export interface UseSubscriptionResult {
  /** Current subscription tier */
  tier: VibePlayerTier;
  /** Whether the subscription store has been hydrated */
  isReady: boolean;
  /** Whether user is on a paid plan */
  isPaid: boolean;
  /** Whether the user can send a Sakha message (respects daily quota) */
  canSendMessage: boolean;
  /** Whether the user can use voice mode */
  canUseVoice: boolean;
  /** Whether early access features are available */
  hasEarlyAccess: boolean;
  /** Whether personalized wisdom is available */
  hasPersonalizedWisdom: boolean;
  /** Remaining Sakha messages today (-1 = unlimited) */
  sakhaRemaining: number;
  /** Daily Sakha message limit (-1 = unlimited) */
  sakhaLimit: number;
  /** Messages used today */
  sakhaUsed: number;
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

const DAILY_LIMITS: Record<VibePlayerTier, number> = {
  free: 5,
  sacred: -1,
  divine: -1,
};

export function useSubscription(): UseSubscriptionResult {
  const tier = useSubscriptionStore((s) => s.tier);
  const isHydrated = useSubscriptionStore((s) => s.isHydrated);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const dailySakhaCount = useSubscriptionStore((s) => s.dailySakhaCount);
  const purchaseStatus = useSubscriptionStore((s) => s.purchaseStatus);
  const error = useSubscriptionStore((s) => s.error);
  const canSendMessageFn = useSubscriptionStore((s) => s.canSendMessage);
  const canUseVoiceFn = useSubscriptionStore((s) => s.canUseVoice);
  const canStartJourneyFn = useSubscriptionStore((s) => s.canStartJourney);
  const hasFeatureFn = useSubscriptionStore((s) => s.hasFeature);

  const limit = DAILY_LIMITS[tier];

  return useMemo(() => ({
    tier,
    isReady: isHydrated,
    isPaid: tier !== 'free',
    canSendMessage: canSendMessageFn(),
    canUseVoice: canUseVoiceFn(),
    hasEarlyAccess: tier === 'divine',
    hasPersonalizedWisdom: tier === 'divine',
    sakhaRemaining: limit === -1 ? -1 : Math.max(0, limit - dailySakhaCount),
    sakhaLimit: limit,
    sakhaUsed: dailySakhaCount,
    expiresAt,
    canStartJourney: canStartJourneyFn,
    hasFeature: hasFeatureFn,
    purchaseStatus,
    error,
  }), [tier, isHydrated, expiresAt, dailySakhaCount, limit, purchaseStatus, error, canSendMessageFn, canUseVoiceFn, canStartJourneyFn, hasFeatureFn]);
}

export default useSubscription;
