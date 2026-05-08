/**
 * Root Layout — Kiaanverse
 *
 * Provider hierarchy and auth gate. Explicit Stack-based routing ensures
 * Expo Router knows about all route groups at mount time, preventing
 * "Attempted to navigate before mounting Root Layout" race conditions.
 *
 * Provider stack (outer → inner):
 *   GestureHandlerRootView → QueryClientProvider → ThemeProvider → I18nProvider
 *
 * Offline-first:
 *   - OfflineBanner shows when device is offline
 *   - SyncQueue processes pending mutations on reconnect + app foreground
 *   - React Query cache persisted to AsyncStorage (24h maxAge)
 *
 * Auth gate:
 *   idle/loading → splash screen held
 *   unauthenticated → /(auth)/login
 *   authenticated + !onboarded → /onboarding
 *   authenticated + onboarded → /(tabs)
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ThemeProvider,
  useTheme,
  colors,
  LoadingMandala,
} from '@kiaanverse/ui';
import { I18nProvider } from '@kiaanverse/i18n';
import {
  api,
  type SyncQueueItem,
  initializeIAP,
  disconnectIAP,
  setIapAccountTag,
} from '@kiaanverse/api';
import {
  useAuthStore,
  useThemeStore,
  useUserPreferencesStore,
  useSyncQueueStore,
  startSyncOnForeground,
  useSubscriptionStore,
} from '@kiaanverse/store';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useNotifications } from '../hooks/useNotifications';
import { useArrivalStatus } from '../hooks/useArrivalStatus';
import { useSacredFonts } from '../hooks/useSacredFonts';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { NotificationToast } from '../components/common/NotificationToast';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ToastContainer } from '../components/common/Toast';
import { SacredArrival } from '../components/common/SacredArrival';
import { initErrorTracking } from '../services/errorTracking';
import { warmDivineVoiceCache } from '../voice/lib/divineVoice';
import {
  registerPlaybackService,
  setupTrackPlayer,
} from '../services/trackPlayerSetup';

// Register background tasks at module level (required by expo-task-manager)
import '../services/backgroundTasks';

// Register the TrackPlayer headless JS service at module load. MUST run before
// any React tree mounts, otherwise lock-screen / Bluetooth / headphone remote
// events have no handler when the UI tree tears down (the exact moment the
// user needs them).
registerPlaybackService();

// Initialize error tracking before any providers mount
initErrorTracking();

// Warm the divine-voice cache early — enumerates the device's
// available TTS voices (typically 4-8 per language on Android) and
// picks the highest-quality neural network voice per supported
// language (en-IN, hi-IN, sa-IN, mr-IN, ta-IN, bn-IN). Caching this
// at app boot means the FIRST Listen tap a user makes already has
// the divine voice resolved — no latency hit on first-use.
//
// Failure is silent and non-blocking: if Speech.getAvailableVoicesAsync
// throws (rare, e.g. on a stripped-down RN dev build), the cache stays
// empty and the engine falls back to its default voice. NOT a crash.
//
// We don't await this — fire-and-forget at module-load time. By the
// time the user navigates to /chat or /voice-companion or taps any
// ListenButton, the cache is populated.
void warmDivineVoiceCache();

// Prevent splash screen from hiding until we're ready
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep cache for offline access
    },
  },
});

/** AsyncStorage persister for React Query offline cache. */
const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'kiaanverse-query-cache',
});

// ---------------------------------------------------------------------------
// Sync Queue Executor — routes queued mutations to the correct API endpoint
// ---------------------------------------------------------------------------

async function executeSyncItem(item: SyncQueueItem): Promise<void> {
  switch (item.type) {
    case 'mood':
      await api.moods.create(
        item.payload as { score: number; tags?: string[]; note?: string }
      );
      break;
    case 'journey_step': {
      const { journeyId, dayIndex } = item.payload as {
        journeyId: string;
        dayIndex: number;
      };
      await api.journeys.completeStep(journeyId, dayIndex);
      break;
    }
    case 'chat_message': {
      const { message, sessionId } = item.payload as {
        message: string;
        sessionId?: string;
      };
      await api.chat.send(message, sessionId);
      break;
    }
    case 'journal': {
      await api.journal.create(
        item.payload as { content_encrypted: string; tags?: string[] }
      );
      break;
    }
    case 'sadhana': {
      await api.sadhana.complete(
        item.payload as {
          mood_score?: number;
          verse_id?: string;
          reflection?: string;
          intention?: string;
        }
      );
      break;
    }
    case 'community_post': {
      const { content, circleId, tags } = item.payload as {
        content: string;
        circleId?: string;
        tags?: string[];
      };
      await api.community.createPost(content, circleId, tags);
      break;
    }
    case 'community_reaction': {
      const { postId, reaction } = item.payload as {
        postId: string;
        reaction: string;
      };
      await api.community.reactToPost(postId, reaction);
      break;
    }
    default:
      // Unknown type — skip, will be dropped after max retries
      break;
  }
}

// ---------------------------------------------------------------------------
// Auth Gate — redirects based on auth + onboarding state
// ---------------------------------------------------------------------------

function AuthGate({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { status, isOnboarded, hasHydrated } = useAuthStore();
  const { isLoaded: arrivalLoaded, hasSeenArrival } = useArrivalStatus();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;
    // Wait for Zustand persist to finish rehydrating isOnboarded from storage.
    // Without this, isOnboarded is stale (false) for a few frames after
    // initialize() resolves, causing a flash redirect to /onboarding.
    if (!hasHydrated) return;
    // Wait for the arrival flag to load from AsyncStorage before routing so we
    // don't flash past the ceremony on first launch.
    if (!arrivalLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    const inArrival = segments[0] === 'arrival';

    // First-launch darshan: unauthenticated users who have not yet seen the
    // arrival ceremony are routed into /arrival before the auth door.
    if (status === 'unauthenticated' && !hasSeenArrival && !inArrival) {
      router.replace('/arrival');
      return;
    }

    if (
      status === 'unauthenticated' &&
      hasSeenArrival &&
      !inAuthGroup &&
      !inArrival
    ) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (
      status === 'authenticated' &&
      isOnboarded &&
      (inAuthGroup || inOnboarding || inArrival)
    ) {
      router.replace('/(tabs)');
    }
  }, [
    status,
    isOnboarded,
    hasHydrated,
    hasSeenArrival,
    arrivalLoaded,
    segments,
    router,
  ]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// App Content — splash screen + status bar + auth gate + offline banner
// ---------------------------------------------------------------------------

function AppContent(): React.JSX.Element {
  const { theme } = useTheme();
  const { status, user, initialize, checkBiometricAvailability } =
    useAuthStore();
  const hydrateSubscription = useSubscriptionStore((s) => s.hydrate);
  const { isOnline } = useNetworkStatus();
  const pendingCount = useSyncQueueStore((s) => s.queue.length);
  const processQueue = useSyncQueueStore((s) => s.processQueue);
  const wasOffline = useRef(false);

  // 7-Act Arrival ceremony. Plays exactly once per device: on first cold start
  // we overlay the SacredArrival on top of the rest of the tree until it
  // dismisses itself. The AsyncStorage flag is written by the 5-page /arrival
  // route after the user explicitly "Begins Your Journey" — so a hard-quit
  // during the ceremony replays it next launch (intentional).
  const { isLoaded: arrivalLoaded, hasSeenArrival } = useArrivalStatus();
  const [ceremonyActive, setCeremonyActive] = useState<boolean | null>(null);
  useEffect(() => {
    if (!arrivalLoaded) return;
    setCeremonyActive((prev) => (prev === null ? !hasSeenArrival : prev));
    // Only the initial load decision drives the overlay — subsequent changes
    // to hasSeenArrival (e.g. the 5-page ceremony marking it seen) must not
    // remount the overlay, which would re-play the animation mid-flow.
  }, [arrivalLoaded, hasSeenArrival]);
  const handleCeremonyComplete = useCallback(() => {
    setCeremonyActive(false);
  }, []);

  // Sacred typography. Holds the splash an extra few hundred ms so the
  // first paint already has Outfit / Cormorant Garamond / Noto Sans
  // Devanagari instead of the platform sans-serif that ships when the
  // .ttf files aren't registered. `ready` is true on success OR error
  // — we never trap the user behind a missing font.
  const fonts = useSacredFonts();

  // Hide splash the moment any React tree lays out (and fonts have
  // resolved). Waiting for status to settle kept the native lantern on
  // screen for up to 8s on a slow auth bootstrap; users read that as a
  // frozen app. Swapping to LoadingMandala immediately makes loading
  // legible.
  const onLayoutReady = useCallback(async () => {
    if (!fonts.ready) return;
    try {
      await SplashScreen.hideAsync();
    } catch {
      // hideAsync throws if the native module is missing or the splash is
      // already hidden — swallow so it never blocks rendering below.
    }
  }, [fonts.ready]);

  // Fail-open splash hide: if the auth bootstrap takes too long or silently
  // hangs, force the splash to hide after 8 seconds so the user sees the
  // LoadingMandala fallback instead of a frozen native splash. Without this
  // guard a slow network + broken token storage would present as a crash.
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => undefined);
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Each step is isolated so a failure in one (e.g. the biometric probe
    // on devices without hardware, or a hydrateSubscription storage read
    // failing on first install) can't block the auth gate from settling.
    // Without this, status stayed 'idle'/'loading' forever → splash never
    // hid and the app appeared to be stuck in a reload loop.
    const setup = async () => {
      try {
        await initialize();
      } catch (err) {
        if (__DEV__) console.warn('[setup] initialize failed:', err);
      }
      try {
        await checkBiometricAvailability();
      } catch (err) {
        if (__DEV__) console.warn('[setup] biometric probe failed:', err);
      }
      try {
        await hydrateSubscription();
      } catch (err) {
        if (__DEV__) console.warn('[setup] hydrateSubscription failed:', err);
      }
      try {
        // Allocate the native audio session up front so the first tap on a
        // Vibe Player track starts immediately. setupTrackPlayer() is
        // idempotent and swallows its own errors, so a failure here cannot
        // block auth bootstrap.
        await setupTrackPlayer();
      } catch (err) {
        if (__DEV__) console.warn('[setup] setupTrackPlayer failed:', err);
      }
    };
    void setup();
    // Run once on mount — Zustand actions are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start app-foreground sync listener
  useEffect(() => {
    const cleanup = startSyncOnForeground(executeSyncItem);
    return cleanup;
  }, []);

  // Play Billing / StoreKit lifecycle — connect when the user is signed
  // in so `flushFailedPurchasesCachedAsPendingAndroid` can replay any
  // purchase cached by Play from a prior crash, and disconnect on logout
  // to release the native connection. The `setIapAccountTag` call binds
  // each purchase to the signed-in user so replayed receipts can't be
  // applied to someone else's account.
  useEffect(() => {
    if (status !== 'authenticated') {
      setIapAccountTag(null);
      return;
    }
    setIapAccountTag(user?.id ?? null);
    void initializeIAP().catch((err) => {
      if (__DEV__) console.warn('[iap] initializeIAP failed:', err);
    });
    return () => {
      void disconnectIAP().catch(() => undefined);
    };
  }, [status, user?.id]);

  // Initialize notification system (channels, handlers, scheduling)
  useNotifications();

  // Auto-sync when connectivity restored
  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      // Process any queued mutations
      void processQueue(executeSyncItem);
      // Refetch stale queries now that we're back online
      void queryClient.invalidateQueries();
    }
  }, [isOnline, processQueue]);

  if (status === 'idle' || status === 'loading') {
    return (
      <View
        style={[styles.loading, { backgroundColor: colors.background.dark }]}
        onLayout={onLayoutReady}
      >
        <LoadingMandala size={120} />
        {ceremonyActive ? (
          <View style={styles.ceremonyOverlay} pointerEvents="auto">
            <SacredArrival onComplete={handleCeremonyComplete} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayoutReady}>
      <StatusBar
        style={
          theme.colors.statusBarStyle === 'light-content' ? 'light' : 'dark'
        }
      />
      <OfflineBanner isOffline={!isOnline} pendingCount={pendingCount} />
      <NotificationToast />
      <ToastContainer />
      <AuthGate>
        {/* Every navigation is a darshan — fade, never slide. Modal presentations
            still slide from the bottom to signal entering/exiting a ritual space. */}
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 320,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />

          {/* Sacred Arrival — first-launch 5-page darshan before auth */}
          <Stack.Screen name="arrival" options={{ animationDuration: 400 }} />

          <Stack.Screen name="wellness" />

          {/* Wisdom Journeys (14/21-day transformation paths) */}
          <Stack.Screen name="journey" />

          <Stack.Screen
            name="subscription"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
              animationDuration: 350,
            }}
          />

          {/* Sacred Tools */}
          <Stack.Screen name="tools" />

          {/* Sacred Journal */}
          <Stack.Screen name="journal" />

          {/* Daily Sadhana */}
          <Stack.Screen name="sadhana" />

          {/* Community & Wisdom Rooms */}
          <Stack.Screen name="community" />
          <Stack.Screen name="wisdom-rooms" />

          {/* Wisdom — Today's Wisdom landing + Read More verse reader */}
          <Stack.Screen name="wisdom" />

          {/* Karma Footprint */}
          <Stack.Screen name="karma-footprint" />

          {/* Analytics & Deep Insights */}
          <Stack.Screen name="analytics" />

          {/* KIAAN Vibe Player — modal from bottom */}
          <Stack.Screen
            name="vibe-player"
            options={{ animation: 'slide_from_bottom', animationDuration: 350 }}
          />

          {/* Settings */}
          <Stack.Screen name="settings" />

          {/* Profile sub-screens (notifications, language, billing, legal, etc.) */}
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthGate>

      {/* 7-Act Arrival ceremony — rendered LAST so it sits on top of every
          other surface during the first cold start. It is a pure overlay:
          the rest of the tree continues mounting underneath so that once
          onComplete fires the subsequent route transition is instant. */}
      {ceremonyActive ? (
        <View style={styles.ceremonyOverlay} pointerEvents="auto">
          <SacredArrival onComplete={handleCeremonyComplete} />
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Root Layout — provider hierarchy
// ---------------------------------------------------------------------------

export default function RootLayout(): React.JSX.Element {
  const { mode, setMode } = useThemeStore();
  const { locale } = useUserPreferencesStore();

  return (
    <GestureHandlerRootView style={styles.container}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: 1000 * 60 * 60 * 24,
        }}
      >
        <ThemeProvider mode={mode} onModeChange={setMode}>
          <I18nProvider
            initialLocale={locale as 'en'}
            namespaces={[
              'common',
              'navigation',
              'errors',
              'auth',
              'home',
              'kiaan',
              'journeys',
              'tools',
              'emotional-reset',
              'karma-reset',
              'journal',
              'sadhana',
              'community',
              'vibe-player',
              'analytics',
              'settings',
            ]}
          >
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </I18nProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ceremonyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 20,
  },
});
