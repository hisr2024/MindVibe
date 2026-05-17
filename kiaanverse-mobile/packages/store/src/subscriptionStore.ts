/**
 * Subscription Store — Zustand state for KIAAN subscription management
 *
 * Manages the user's subscription tier, purchase state, and feature gating.
 * Persists tier to AsyncStorage for offline access. Source of truth is the
 * backend; the store caches the last-known tier for instant UI rendering.
 *
 * 4-tier model aligned with backend (March 2026):
 * - free (Seeker): 5 KIAAN questions/month, 1 journey
 * - bhakta: 50 questions/month, encrypted journal, 3 journeys
 * - sadhak: 300 questions/month, all features, 10 journeys
 * - siddha: Unlimited everything, dedicated support
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

export type SubscriptionTier = 'free' | 'bhakta' | 'sadhak' | 'siddha';

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
  tier: SubscriptionTier;
  /** When the subscription expires (ISO string) */
  expiresAt: string | null;
  /** Purchase flow status */
  purchaseStatus: PurchaseStatus;
  /** Error message from last failed operation */
  error: string | null;
  /** Monthly KIAAN question count (resets at billing period start) */
  monthlyKiaanCount: number;
  /** Month string for tracking monthly reset (YYYY-MM) */
  kiaanCountMonth: string;
  /** Whether the store has been hydrated from persistence */
  isHydrated: boolean;
}

export interface SubscriptionActions {
  /** Set tier after successful purchase or restore */
  setTier: (tier: SubscriptionTier, expiresAt?: string | null) => void;
  /** Set purchase flow status */
  setPurchaseStatus: (status: PurchaseStatus, error?: string | null) => void;
  /** Increment monthly KIAAN question count */
  incrementKiaanCount: () => void;
  /** Check if user can send a KIAAN question (respects monthly quota) */
  canSendMessage: () => boolean;
  /** Check if user can use voice mode (Sadhak+) */
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

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  bhakta: 1,
  sadhak: 2,
  siddha: 3,
};

/** Monthly KIAAN question limits per tier (-1 = unlimited) */
const MONTHLY_KIAAN_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  bhakta: 50,
  sadhak: 300,
  siddha: -1,
};

/** Maximum active wisdom journeys per tier (-1 = unlimited) */
const JOURNEY_LIMITS: Record<SubscriptionTier, number> = {
  free: 1,
  bhakta: 3,
  sadhak: 10,
  siddha: -1,
};

/** Features gated by minimum tier — aligned with backend feature_config.py */
const FEATURE_GATES: Record<string, SubscriptionTier> = {
  // KIAAN Ecosystem
  kiaanDivineChat: 'free',
  kiaanFriendMode: 'free',
  kiaanVoiceCompanion: 'sadhak',
  kiaanVoiceSynthesis: 'sadhak',
  kiaanSoulReading: 'sadhak',
  kiaanQuantumDive: 'sadhak',
  kiaanAgent: 'sadhak',
  // Assistants
  arthaReframing: 'sadhak',
  viyogaDetachment: 'sadhak',
  relationshipCompass: 'sadhak',
  emotionalResetGuide: 'sadhak',
  // Features
  encryptedJournal: 'bhakta',
  moodTracking: 'free',
  dailyWisdom: 'free',
  advancedAnalytics: 'sadhak',
  offlineAccess: 'sadhak',
  // Support
  prioritySupport: 'sadhak',
  dedicatedSupport: 'siddha',
  teamFeatures: 'siddha',
  priorityVoiceProcessing: 'siddha',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function persistState(state: Pick<SubscriptionState, 'tier' | 'expiresAt' | 'monthlyKiaanCount' | 'kiaanCountMonth'>): Promise<void> {
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
    monthlyKiaanCount: 0,
    kiaanCountMonth: getCurrentMonth(),
    isHydrated: false,

    // Actions
    setTier: (tier, expiresAt = null) => {
      set({ tier, expiresAt, purchaseStatus: 'success', error: null });
      void persistState({ tier, expiresAt, monthlyKiaanCount: get().monthlyKiaanCount, kiaanCountMonth: get().kiaanCountMonth });
    },

    setPurchaseStatus: (status, error = null) => {
      set({ purchaseStatus: status, error });
    },

    incrementKiaanCount: () => {
      const state = get();
      const currentMonth = getCurrentMonth();

      // Reset count if it's a new month
      const newCount = state.kiaanCountMonth === currentMonth
        ? state.monthlyKiaanCount + 1
        : 1;

      set({ monthlyKiaanCount: newCount, kiaanCountMonth: currentMonth });
      void persistState({
        tier: state.tier,
        expiresAt: state.expiresAt,
        monthlyKiaanCount: newCount,
        kiaanCountMonth: currentMonth,
      });
    },

    canSendMessage: () => {
      const { tier, monthlyKiaanCount, kiaanCountMonth } = get();
      const limit = MONTHLY_KIAAN_LIMITS[tier];

      // Unlimited
      if (limit === -1) return true;

      // New month — count resets
      if (kiaanCountMonth !== getCurrentMonth()) return true;

      return monthlyKiaanCount < limit;
    },

    canUseVoice: () => {
      const { tier } = get();
      return TIER_RANK[tier] >= TIER_RANK.sadhak;
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
        monthlyKiaanCount: get().monthlyKiaanCount,
        kiaanCountMonth: get().kiaanCountMonth,
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
          void persistState({ tier: 'free', expiresAt: null, monthlyKiaanCount: 0, kiaanCountMonth: getCurrentMonth() });
          return;
        }

        // Reset monthly count if it's a new month
        const currentMonth = getCurrentMonth();
        const monthlyKiaanCount = data.kiaanCountMonth === currentMonth
          ? (data.monthlyKiaanCount ?? 0)
          : 0;

        set({
          tier: data.tier ?? 'free',
          expiresAt: data.expiresAt ?? null,
          monthlyKiaanCount,
          kiaanCountMonth: currentMonth,
          isHydrated: true,
        });
      } catch {
        set({ isHydrated: true });
      }
    },
  }),
);
