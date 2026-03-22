/**
 * Subscription Store — Zustand state for KIAAN Vibe Player subscriptions
 *
 * Manages the user's subscription tier, purchase state, and feature gating.
 * Persists tier to AsyncStorage for offline access. Source of truth is the
 * backend; the store caches the last-known tier for instant UI rendering.
 *
 * Feature gating pattern:
 *   const { canUseVoice, canSendMessage, tier } = useSubscription()
 *   if (!canUseVoice) { router.push('/subscription'); return }
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VibePlayerTier = 'free' | 'sacred' | 'divine';

export type PurchaseStatus =
  | 'idle'
  | 'loading'
  | 'purchasing'
  | 'restoring'
  | 'verifying'
  | 'success'
  | 'error';

export interface SubscriptionState {
  /** Current subscription tier */
  tier: VibePlayerTier;
  /** When the subscription expires (ISO string) */
  expiresAt: string | null;
  /** Purchase flow status */
  purchaseStatus: PurchaseStatus;
  /** Error message from last failed operation */
  error: string | null;
  /** Daily Sakha message count (resets at midnight) */
  dailySakhaCount: number;
  /** Date string for tracking daily reset */
  sakhaCountDate: string;
  /** Whether the store has been hydrated from persistence */
  isHydrated: boolean;
}

export interface SubscriptionActions {
  /** Set tier after successful purchase or restore */
  setTier: (tier: VibePlayerTier, expiresAt?: string | null) => void;
  /** Set purchase flow status */
  setPurchaseStatus: (status: PurchaseStatus, error?: string | null) => void;
  /** Increment daily Sakha message count */
  incrementSakhaCount: () => void;
  /** Check if user can send a Sakha message (respects daily quota) */
  canSendMessage: () => boolean;
  /** Check if user can use voice mode */
  canUseVoice: () => boolean;
  /** Check if user can start a new journey (respects journey limit) */
  canStartJourney: (currentJourneyCount: number) => boolean;
  /** Check if user has access to a feature */
  hasFeature: (feature: string) => boolean;
  /** Downgrade to free tier (expired subscription) */
  downgradeToFree: () => void;
  /** Reset purchase error state */
  clearError: () => void;
  /** Hydrate from AsyncStorage */
  hydrate: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'kiaanverse_subscription';

const TIER_RANK: Record<VibePlayerTier, number> = {
  free: 0,
  sacred: 1,
  divine: 2,
};

const DAILY_SAKHA_LIMITS: Record<VibePlayerTier, number> = {
  free: 5,
  sacred: -1, // unlimited
  divine: -1, // unlimited
};

const JOURNEY_LIMITS: Record<VibePlayerTier, number> = {
  free: 2,
  sacred: -1, // unlimited
  divine: -1, // unlimited
};

/** Features available per tier — feature name → minimum tier */
const FEATURE_GATES: Record<string, VibePlayerTier> = {
  basicGita: 'free',
  fullGita: 'sacred',
  voiceMode: 'sacred',
  allJourneys: 'sacred',
  unlimitedSakha: 'sacred',
  earlyAccess: 'divine',
  personalizedWisdom: 'divine',
  offlineAccess: 'sacred',
  prioritySupport: 'divine',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

async function persistState(state: Pick<SubscriptionState, 'tier' | 'expiresAt' | 'dailySakhaCount' | 'sakhaCountDate'>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Persistence failure is non-critical
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>(
  (set, get) => ({
    // State
    tier: 'free',
    expiresAt: null,
    purchaseStatus: 'idle',
    error: null,
    dailySakhaCount: 0,
    sakhaCountDate: getTodayString(),
    isHydrated: false,

    // Actions
    setTier: (tier, expiresAt = null) => {
      set({ tier, expiresAt, purchaseStatus: 'success', error: null });
      void persistState({ tier, expiresAt, dailySakhaCount: get().dailySakhaCount, sakhaCountDate: get().sakhaCountDate });
    },

    setPurchaseStatus: (status, error = null) => {
      set({ purchaseStatus: status, error });
    },

    incrementSakhaCount: () => {
      const state = get();
      const today = getTodayString();

      // Reset count if it's a new day
      const newCount = state.sakhaCountDate === today
        ? state.dailySakhaCount + 1
        : 1;

      set({ dailySakhaCount: newCount, sakhaCountDate: today });
      void persistState({
        tier: state.tier,
        expiresAt: state.expiresAt,
        dailySakhaCount: newCount,
        sakhaCountDate: today,
      });
    },

    canSendMessage: () => {
      const { tier, dailySakhaCount, sakhaCountDate } = get();
      const limit = DAILY_SAKHA_LIMITS[tier];

      // Unlimited
      if (limit === -1) return true;

      // New day — count resets
      if (sakhaCountDate !== getTodayString()) return true;

      return dailySakhaCount < limit;
    },

    canUseVoice: () => {
      const { tier } = get();
      return TIER_RANK[tier] >= TIER_RANK.sacred;
    },

    canStartJourney: (currentJourneyCount: number) => {
      const { tier } = get();
      const limit = JOURNEY_LIMITS[tier];
      if (limit === -1) return true;
      return currentJourneyCount < limit;
    },

    hasFeature: (feature: string) => {
      const { tier } = get();
      const requiredTier = FEATURE_GATES[feature];
      if (!requiredTier) return true; // Unknown features are unrestricted
      return TIER_RANK[tier] >= TIER_RANK[requiredTier];
    },

    downgradeToFree: () => {
      set({
        tier: 'free',
        expiresAt: null,
        purchaseStatus: 'idle',
        error: null,
      });
      void persistState({
        tier: 'free',
        expiresAt: null,
        dailySakhaCount: get().dailySakhaCount,
        sakhaCountDate: get().sakhaCountDate,
      });
    },

    clearError: () => {
      set({ error: null, purchaseStatus: 'idle' });
    },

    hydrate: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          set({ isHydrated: true });
          return;
        }

        const data = JSON.parse(stored) as Partial<SubscriptionState>;

        // Check if subscription has expired
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          set({ tier: 'free', expiresAt: null, isHydrated: true });
          void persistState({ tier: 'free', expiresAt: null, dailySakhaCount: 0, sakhaCountDate: getTodayString() });
          return;
        }

        // Reset daily count if it's a new day
        const today = getTodayString();
        const dailySakhaCount = data.sakhaCountDate === today
          ? (data.dailySakhaCount ?? 0)
          : 0;

        set({
          tier: data.tier ?? 'free',
          expiresAt: data.expiresAt ?? null,
          dailySakhaCount,
          sakhaCountDate: today,
          isHydrated: true,
        });
      } catch {
        set({ isHydrated: true });
      }
    },
  }),
);
