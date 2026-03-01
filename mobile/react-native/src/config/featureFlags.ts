/**
 * Feature Flag System for MindVibe Mobile
 *
 * Provides controlled feature rollout with:
 * - Remote flag fetching from backend API
 * - Local MMKV cache for offline availability
 * - Subscription-tier gating (FREE, BASIC, PREMIUM, ENTERPRISE)
 * - Percentage-based progressive rollout
 * - Override support for development/testing
 *
 * Flags are refreshed every 15 minutes and cached locally.
 * The KIAAN AI Ecosystem is never gated — it is always available
 * at the tier-appropriate level defined by the backend.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export interface FeatureFlag {
  /** Unique identifier (e.g., "vibe_player_sleep_timer") */
  key: string;
  /** Whether the flag is globally enabled */
  enabled: boolean;
  /** Minimum subscription tier required (null = available to all) */
  minTier: SubscriptionTier | null;
  /** Percentage of users who see this feature (0-100) */
  rolloutPercent: number;
  /** Optional metadata (A/B test variant, config values, etc.) */
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagConfig {
  /** Backend API URL for flag fetching */
  apiUrl: string;
  /** Refresh interval in milliseconds */
  refreshInterval: number;
  /** Local overrides for development */
  overrides: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Default Flag Definitions
// ---------------------------------------------------------------------------

/**
 * Default flags — used when backend is unreachable (offline fallback).
 * Conservative defaults: new features off, core features on.
 */
export const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  // Core features (always on)
  vibe_player: {
    key: 'vibe_player',
    enabled: true,
    minTier: null,
    rolloutPercent: 100,
  },
  sakha_companion_text: {
    key: 'sakha_companion_text',
    enabled: true,
    minTier: null,
    rolloutPercent: 100,
  },
  gita_verse_browser: {
    key: 'gita_verse_browser',
    enabled: true,
    minTier: null,
    rolloutPercent: 100,
  },
  mood_tracking: {
    key: 'mood_tracking',
    enabled: true,
    minTier: null,
    rolloutPercent: 100,
  },
  offline_mode: {
    key: 'offline_mode',
    enabled: true,
    minTier: null,
    rolloutPercent: 100,
  },

  // Tier-gated features
  sakha_companion_voice: {
    key: 'sakha_companion_voice',
    enabled: true,
    minTier: 'BASIC',
    rolloutPercent: 100,
  },
  vibe_player_offline_cache: {
    key: 'vibe_player_offline_cache',
    enabled: true,
    minTier: 'BASIC',
    rolloutPercent: 100,
  },
  journal_encryption: {
    key: 'journal_encryption',
    enabled: true,
    minTier: 'BASIC',
    rolloutPercent: 100,
  },
  journey_system: {
    key: 'journey_system',
    enabled: true,
    minTier: null,
    rolloutPercent: 100,
    metadata: { freeTrialDays: 3 },
  },
  analytics_dashboard: {
    key: 'analytics_dashboard',
    enabled: true,
    minTier: 'BASIC',
    rolloutPercent: 100,
  },
  wisdom_rooms: {
    key: 'wisdom_rooms',
    enabled: true,
    minTier: 'PREMIUM',
    rolloutPercent: 100,
  },

  // Progressive rollout features
  vibe_player_sleep_timer: {
    key: 'vibe_player_sleep_timer',
    enabled: true,
    minTier: null,
    rolloutPercent: 50,
  },
  sakha_emotion_theme: {
    key: 'sakha_emotion_theme',
    enabled: true,
    minTier: null,
    rolloutPercent: 30,
  },
  wake_word_detection: {
    key: 'wake_word_detection',
    enabled: false,
    minTier: 'PREMIUM',
    rolloutPercent: 0,
    metadata: { phrases: ['hey kiaan', 'namaste kiaan'] },
  },
};

// ---------------------------------------------------------------------------
// Subscription Tier Hierarchy
// ---------------------------------------------------------------------------

const TIER_LEVELS: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3,
};

function isTierSufficient(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier | null,
): boolean {
  if (requiredTier === null) return true;
  return TIER_LEVELS[userTier] >= TIER_LEVELS[requiredTier];
}

// ---------------------------------------------------------------------------
// Deterministic User Bucketing (for percentage rollout)
// ---------------------------------------------------------------------------

/**
 * Deterministic hash of userId + flagKey to assign a consistent bucket (0-99).
 * Users always see the same variant for a given flag.
 */
function getUserBucket(userId: string, flagKey: string): number {
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash) % 100;
}

// ---------------------------------------------------------------------------
// Feature Flag Service
// ---------------------------------------------------------------------------

export class FeatureFlagService {
  private flags: Record<string, FeatureFlag>;
  private config: FeatureFlagConfig;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private userId: string | null = null;
  private userTier: SubscriptionTier = 'FREE';

  constructor(config: Partial<FeatureFlagConfig> = {}) {
    this.config = {
      // No public feature-flags endpoint exists yet (only admin).
      // Flags are evaluated client-side from DEFAULT_FLAGS until
      // a public endpoint is added to the backend.
      apiUrl: '/api/feature-flags',
      refreshInterval: 15 * 60 * 1000, // 15 minutes
      overrides: {},
      ...config,
    };
    this.flags = { ...DEFAULT_FLAGS };
  }

  /**
   * Initialize with user context. Call after authentication.
   */
  async initialize(userId: string, tier: SubscriptionTier): Promise<void> {
    this.userId = userId;
    this.userTier = tier;

    // Load cached flags from MMKV (fast, synchronous)
    this.loadFromCache();

    // Fetch fresh flags from backend (async, non-blocking)
    await this.refresh().catch(() => {
      // Offline — cached flags are used. No action needed.
    });

    // Start periodic refresh
    this.startPeriodicRefresh();
  }

  /**
   * Check if a feature is enabled for the current user.
   *
   * Evaluation order:
   * 1. Dev override (if set) — takes precedence
   * 2. Global enabled flag — must be true
   * 3. Subscription tier gate — user must meet minimum tier
   * 4. Rollout percentage — deterministic bucketing
   */
  isEnabled(flagKey: string): boolean {
    // Dev override
    if (flagKey in this.config.overrides) {
      return this.config.overrides[flagKey];
    }

    const flag = this.flags[flagKey];
    if (!flag) return false;

    // Global kill switch
    if (!flag.enabled) return false;

    // Tier check
    if (!isTierSufficient(this.userTier, flag.minTier)) return false;

    // Rollout percentage
    if (flag.rolloutPercent < 100 && this.userId) {
      const bucket = getUserBucket(this.userId, flagKey);
      if (bucket >= flag.rolloutPercent) return false;
    }

    return true;
  }

  /**
   * Get metadata for a feature flag (e.g., A/B test variant).
   */
  getMetadata(flagKey: string): Record<string, unknown> | undefined {
    return this.flags[flagKey]?.metadata;
  }

  /**
   * Get all flags with their evaluated state for the current user.
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const key of Object.keys(this.flags)) {
      result[key] = this.isEnabled(key);
    }
    return result;
  }

  /**
   * Fetch fresh flags from the backend API.
   *
   * Currently a no-op because the backend does not expose a public
   * feature-flags endpoint (only admin). Flags are evaluated locally
   * from DEFAULT_FLAGS. When a public endpoint is added, uncomment
   * the fetch logic below.
   */
  async refresh(): Promise<void> {
    // No public endpoint available yet — use default flags.
    // When /api/feature-flags is implemented, replace with:
    //
    // try {
    //   const { data } = await apiClient.get(this.config.apiUrl);
    //   const remoteFlags: FeatureFlag[] = data;
    //   for (const flag of remoteFlags) {
    //     this.flags[flag.key] = flag;
    //   }
    //   this.saveToCache();
    // } catch {
    //   // Network error — keep using cached/default flags
    // }
  }

  /**
   * Set a development override for a flag.
   */
  setOverride(flagKey: string, enabled: boolean): void {
    this.config.overrides[flagKey] = enabled;
  }

  /**
   * Clear all development overrides.
   */
  clearOverrides(): void {
    this.config.overrides = {};
  }

  /**
   * Clean up (stop refresh timer).
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // --- Private helpers ---

  private startPeriodicRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.refresh().catch(() => {
        // Silent failure — cached flags remain valid
      });
    }, this.config.refreshInterval);
  }

  private loadFromCache(): void {
    // In production, this reads from MMKV:
    // const cached = MMKV.getString('feature_flags');
    // if (cached) this.flags = { ...DEFAULT_FLAGS, ...JSON.parse(cached) };
  }

  private saveToCache(): void {
    // In production, this writes to MMKV:
    // MMKV.set('feature_flags', JSON.stringify(this.flags));
  }
}

// ---------------------------------------------------------------------------
// React Hook for Feature Flags
// ---------------------------------------------------------------------------

/**
 * Usage in components:
 *
 * ```tsx
 * function VibePlayerScreen() {
 *   const isSleepTimerEnabled = useFeatureFlag('vibe_player_sleep_timer');
 *
 *   return (
 *     <View>
 *       <PlaybackControls />
 *       {isSleepTimerEnabled && <SleepTimerButton />}
 *     </View>
 *   );
 * }
 * ```
 */
export function createFeatureFlagHook(service: FeatureFlagService) {
  return function useFeatureFlag(flagKey: string): boolean {
    // In production, this would subscribe to Zustand store for reactivity.
    // For now, it evaluates synchronously from the service.
    return service.isEnabled(flagKey);
  };
}

// ---------------------------------------------------------------------------
// Singleton Instance
// ---------------------------------------------------------------------------

export const featureFlags = new FeatureFlagService({
  refreshInterval: 15 * 60 * 1000,
});

export const useFeatureFlag = createFeatureFlagHook(featureFlags);
