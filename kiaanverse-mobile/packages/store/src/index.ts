/**
 * @kiaanverse/store — Zustand state management
 *
 * All stores use immer middleware for immutable updates
 * and devtools middleware for Redux DevTools in __DEV__.
 */

// Auth
export { useAuthStore, type AuthStatus } from './authStore';

// Theme
export { useThemeStore, type ThemeMode } from './themeStore';

// Journey
export { useJourneyStore, type JourneyProgress } from './journeyStore';

// Onboarding
export { useOnboardingStore, type OnboardingAnswers } from './onboardingStore';

// User Preferences
export { useUserPreferencesStore, type VoiceGender } from './userPreferencesStore';

// Sadhana (Daily Practice)
export { useSadhanaStore, type SadhanaPhase } from './sadhanaStore';

// Gita
export { useGitaStore, type VerseRef } from './gitaStore';

// Sync Queue
export { useSyncQueueStore, startSyncOnForeground, type MutationType } from './syncQueue';

// Mood
export { useMoodStore, MOOD_STATES } from './moodStore';

// Chat (KIAAN Sakha)
export { useChatStore, type ChatMessage } from './chatStore';

// Wellness (Mood + Karma + Streak)
export { useWellnessStore } from './wellnessStore';

// Subscription (4-tier: free/bhakta/sadhak/siddha)
export { useSubscriptionStore, type SubscriptionTier, type PurchaseStatus } from './subscriptionStore';

// UI (Modals, Toasts, Theme, First Launch)
export { useUiStore, type ModalType, type Toast } from './uiStore';

// Persistence Adapters
export {
  secureStoreAdapter,
  asyncStorageAdapter,
  createAsyncStorage,
  createSecureStorage,
  hydrateAll,
} from './persistence';

// Emotional Reset (7-step sacred healing flow)
export { useEmotionalResetStore, type EmotionalResetStep } from './emotionalResetStore';

// Karma Reset (4-phase sacred healing ritual)
export { useKarmaResetStore, type KarmaResetPhase } from './karmaResetStore';

// Journal (encrypted sacred reflections)
export { useJournalStore, type JournalEntry } from './journalStore';

// Community (circles, posts, social)
export { useCommunityStore } from './communityStore';

// Vibe Player (sacred meditation music playback)
export { useVibePlayerStore, type RepeatMode, type VibeTrack } from './vibePlayerStore';

// Deep Insights (analytics and emotional intelligence)
export { useDeepInsightsStore, type DateRange } from './deepInsightsStore';

// Relationship Compass (relationship guidance sessions)
export { useRelationshipStore } from './relationshipStore';
