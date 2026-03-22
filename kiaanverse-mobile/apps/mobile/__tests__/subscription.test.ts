/**
 * Tests for the subscription store feature gating logic.
 *
 * Covers:
 * - Free tier limits (5 Sakha messages/day, 2 journeys)
 * - Sacred tier unlocks (unlimited Sakha, voice, all journeys)
 * - Divine tier unlocks (early access, personalized wisdom)
 * - Daily quota reset
 * - Expired subscription downgrade
 */

import { useSubscriptionStore } from '@kiaanverse/store';

// Reset store between tests
beforeEach(() => {
  useSubscriptionStore.setState({
    tier: 'free',
    expiresAt: null,
    purchaseStatus: 'idle',
    error: null,
    dailySakhaCount: 0,
    sakhaCountDate: new Date().toISOString().split('T')[0],
    isHydrated: true,
  });
});

describe('Subscription Store - Feature Gating', () => {
  describe('Free Tier', () => {
    it('allows sending messages under daily limit', () => {
      const { canSendMessage } = useSubscriptionStore.getState();
      expect(canSendMessage()).toBe(true);
    });

    it('blocks messages after daily limit reached', () => {
      const store = useSubscriptionStore.getState();
      // Simulate 5 messages sent
      for (let i = 0; i < 5; i++) {
        store.incrementSakhaCount();
      }
      expect(store.canSendMessage()).toBe(false);
    });

    it('blocks voice mode', () => {
      const { canUseVoice } = useSubscriptionStore.getState();
      expect(canUseVoice()).toBe(false);
    });

    it('allows starting journeys under limit', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(0)).toBe(true);
      expect(canStartJourney(1)).toBe(true);
    });

    it('blocks starting journeys at limit', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(2)).toBe(false);
      expect(canStartJourney(5)).toBe(false);
    });

    it('blocks early access features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('earlyAccess')).toBe(false);
      expect(hasFeature('personalizedWisdom')).toBe(false);
    });
  });

  describe('Sacred Tier', () => {
    beforeEach(() => {
      useSubscriptionStore.getState().setTier('sacred', '2026-04-22T00:00:00Z');
    });

    it('allows unlimited Sakha messages', () => {
      const store = useSubscriptionStore.getState();
      // Send many messages
      for (let i = 0; i < 100; i++) {
        store.incrementSakhaCount();
      }
      expect(store.canSendMessage()).toBe(true);
    });

    it('allows voice mode', () => {
      const { canUseVoice } = useSubscriptionStore.getState();
      expect(canUseVoice()).toBe(true);
    });

    it('allows unlimited journeys', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(100)).toBe(true);
    });

    it('allows full Gita and offline access', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('fullGita')).toBe(true);
      expect(hasFeature('offlineAccess')).toBe(true);
    });

    it('blocks Divine-only features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('earlyAccess')).toBe(false);
      expect(hasFeature('personalizedWisdom')).toBe(false);
    });
  });

  describe('Divine Tier', () => {
    beforeEach(() => {
      useSubscriptionStore.getState().setTier('divine', '2026-04-22T00:00:00Z');
    });

    it('allows all Sacred features', () => {
      const store = useSubscriptionStore.getState();
      expect(store.canSendMessage()).toBe(true);
      expect(store.canUseVoice()).toBe(true);
      expect(store.canStartJourney(100)).toBe(true);
    });

    it('allows early access and personalized wisdom', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('earlyAccess')).toBe(true);
      expect(hasFeature('personalizedWisdom')).toBe(true);
      expect(hasFeature('prioritySupport')).toBe(true);
    });
  });

  describe('Tier Transitions', () => {
    it('downgrade to free clears expiry', () => {
      const store = useSubscriptionStore.getState();
      store.setTier('sacred', '2026-04-22T00:00:00Z');
      expect(store.tier).toBe('sacred');

      store.downgradeToFree();
      expect(useSubscriptionStore.getState().tier).toBe('free');
      expect(useSubscriptionStore.getState().expiresAt).toBeNull();
    });

    it('upgrade preserves daily count', () => {
      const store = useSubscriptionStore.getState();
      store.incrementSakhaCount();
      store.incrementSakhaCount();

      store.setTier('sacred');
      expect(useSubscriptionStore.getState().dailySakhaCount).toBe(2);
      // But now unlimited, so can still send
      expect(useSubscriptionStore.getState().canSendMessage()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('setPurchaseStatus sets error', () => {
      const store = useSubscriptionStore.getState();
      store.setPurchaseStatus('error', 'Payment failed');
      expect(useSubscriptionStore.getState().error).toBe('Payment failed');
      expect(useSubscriptionStore.getState().purchaseStatus).toBe('error');
    });

    it('clearError resets status', () => {
      const store = useSubscriptionStore.getState();
      store.setPurchaseStatus('error', 'Payment failed');
      store.clearError();
      expect(useSubscriptionStore.getState().error).toBeNull();
      expect(useSubscriptionStore.getState().purchaseStatus).toBe('idle');
    });
  });

  describe('Unknown Features', () => {
    it('unknown features are unrestricted', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('nonExistentFeature')).toBe(true);
    });
  });
});
