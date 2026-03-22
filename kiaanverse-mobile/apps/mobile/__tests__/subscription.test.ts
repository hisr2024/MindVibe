/**
 * Tests for the subscription store feature gating logic.
 *
 * 4-tier model (March 2026):
 * - free (Seeker): 5 KIAAN questions/month, 1 journey
 * - bhakta: 50 questions/month, encrypted journal, 3 journeys
 * - sadhak: 300 questions/month, all features, 10 journeys
 * - siddha: Unlimited everything, dedicated support
 *
 * Covers:
 * - Free tier limits (5 KIAAN questions/month, 1 journey)
 * - Bhakta tier unlocks (50 questions, journal, 3 journeys)
 * - Sadhak tier unlocks (300 questions, voice, agent, 10 journeys)
 * - Siddha tier unlocks (unlimited everything, dedicated support)
 * - Monthly quota reset
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
    monthlyKiaanCount: 0,
    kiaanCountMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    isHydrated: true,
  });
});

describe('Subscription Store - Feature Gating', () => {
  describe('Free Tier (Seeker)', () => {
    it('allows sending messages under monthly limit', () => {
      const { canSendMessage } = useSubscriptionStore.getState();
      expect(canSendMessage()).toBe(true);
    });

    it('blocks messages after monthly limit of 5 reached', () => {
      const store = useSubscriptionStore.getState();
      for (let i = 0; i < 5; i++) {
        store.incrementKiaanCount();
      }
      expect(store.canSendMessage()).toBe(false);
    });

    it('blocks voice mode', () => {
      const { canUseVoice } = useSubscriptionStore.getState();
      expect(canUseVoice()).toBe(false);
    });

    it('allows starting 1 journey', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(0)).toBe(true);
    });

    it('blocks starting journeys at limit of 1', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(1)).toBe(false);
      expect(canStartJourney(5)).toBe(false);
    });

    it('blocks Sadhak+ features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('kiaanVoiceCompanion')).toBe(false);
      expect(hasFeature('kiaanAgent')).toBe(false);
      expect(hasFeature('arthaReframing')).toBe(false);
      expect(hasFeature('advancedAnalytics')).toBe(false);
    });

    it('blocks Bhakta+ features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('encryptedJournal')).toBe(false);
    });

    it('allows free-tier features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('kiaanDivineChat')).toBe(true);
      expect(hasFeature('kiaanFriendMode')).toBe(true);
      expect(hasFeature('moodTracking')).toBe(true);
      expect(hasFeature('dailyWisdom')).toBe(true);
    });
  });

  describe('Bhakta Tier', () => {
    beforeEach(() => {
      useSubscriptionStore.getState().setTier('bhakta', '2026-04-22T00:00:00Z');
    });

    it('allows 50 KIAAN questions per month', () => {
      const store = useSubscriptionStore.getState();
      for (let i = 0; i < 50; i++) {
        store.incrementKiaanCount();
      }
      // At limit — should block
      expect(store.canSendMessage()).toBe(false);
    });

    it('allows 49 questions (under limit)', () => {
      const store = useSubscriptionStore.getState();
      for (let i = 0; i < 49; i++) {
        store.incrementKiaanCount();
      }
      expect(store.canSendMessage()).toBe(true);
    });

    it('blocks voice mode (Sadhak+ only)', () => {
      const { canUseVoice } = useSubscriptionStore.getState();
      expect(canUseVoice()).toBe(false);
    });

    it('allows up to 3 journeys', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(0)).toBe(true);
      expect(canStartJourney(2)).toBe(true);
      expect(canStartJourney(3)).toBe(false);
    });

    it('allows encrypted journal', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('encryptedJournal')).toBe(true);
    });

    it('blocks Sadhak+ features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('kiaanVoiceCompanion')).toBe(false);
      expect(hasFeature('kiaanAgent')).toBe(false);
      expect(hasFeature('arthaReframing')).toBe(false);
    });
  });

  describe('Sadhak Tier', () => {
    beforeEach(() => {
      useSubscriptionStore.getState().setTier('sadhak', '2026-04-22T00:00:00Z');
    });

    it('allows 300 KIAAN questions per month', () => {
      const store = useSubscriptionStore.getState();
      for (let i = 0; i < 300; i++) {
        store.incrementKiaanCount();
      }
      expect(store.canSendMessage()).toBe(false);
    });

    it('allows voice mode', () => {
      const { canUseVoice } = useSubscriptionStore.getState();
      expect(canUseVoice()).toBe(true);
    });

    it('allows up to 10 journeys', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(9)).toBe(true);
      expect(canStartJourney(10)).toBe(false);
    });

    it('allows all Sadhak features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('kiaanVoiceCompanion')).toBe(true);
      expect(hasFeature('kiaanAgent')).toBe(true);
      expect(hasFeature('kiaanSoulReading')).toBe(true);
      expect(hasFeature('kiaanQuantumDive')).toBe(true);
      expect(hasFeature('arthaReframing')).toBe(true);
      expect(hasFeature('viyogaDetachment')).toBe(true);
      expect(hasFeature('relationshipCompass')).toBe(true);
      expect(hasFeature('emotionalResetGuide')).toBe(true);
      expect(hasFeature('encryptedJournal')).toBe(true);
      expect(hasFeature('advancedAnalytics')).toBe(true);
      expect(hasFeature('offlineAccess')).toBe(true);
      expect(hasFeature('prioritySupport')).toBe(true);
    });

    it('blocks Siddha-only features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('dedicatedSupport')).toBe(false);
      expect(hasFeature('teamFeatures')).toBe(false);
    });
  });

  describe('Siddha Tier', () => {
    beforeEach(() => {
      useSubscriptionStore.getState().setTier('siddha', '2026-04-22T00:00:00Z');
    });

    it('allows unlimited KIAAN questions', () => {
      const store = useSubscriptionStore.getState();
      for (let i = 0; i < 1000; i++) {
        store.incrementKiaanCount();
      }
      expect(store.canSendMessage()).toBe(true);
    });

    it('allows all Sadhak features', () => {
      const store = useSubscriptionStore.getState();
      expect(store.canSendMessage()).toBe(true);
      expect(store.canUseVoice()).toBe(true);
      expect(store.canStartJourney(100)).toBe(true);
    });

    it('allows dedicated support and team features', () => {
      const { hasFeature } = useSubscriptionStore.getState();
      expect(hasFeature('dedicatedSupport')).toBe(true);
      expect(hasFeature('teamFeatures')).toBe(true);
      expect(hasFeature('priorityVoiceProcessing')).toBe(true);
    });

    it('allows unlimited journeys', () => {
      const { canStartJourney } = useSubscriptionStore.getState();
      expect(canStartJourney(1000)).toBe(true);
    });
  });

  describe('Tier Transitions', () => {
    it('downgrade to free clears expiry', () => {
      const store = useSubscriptionStore.getState();
      store.setTier('sadhak', '2026-04-22T00:00:00Z');
      expect(store.tier).toBe('sadhak');

      store.downgradeToFree();
      expect(useSubscriptionStore.getState().tier).toBe('free');
      expect(useSubscriptionStore.getState().expiresAt).toBeNull();
    });

    it('upgrade preserves monthly count', () => {
      const store = useSubscriptionStore.getState();
      store.incrementKiaanCount();
      store.incrementKiaanCount();

      store.setTier('bhakta');
      expect(useSubscriptionStore.getState().monthlyKiaanCount).toBe(2);
      // Bhakta allows 50, so 2 used is fine
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
