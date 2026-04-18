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
 *   authenticated + onboarded → /(tabs)/home
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme, colors, LoadingMandala } from '@kiaanverse/ui';
import { I18nProvider } from '@kiaanverse/i18n';
import { api, type SyncQueueItem } from '@kiaanverse/api';
import { useAuthStore, useThemeStore, useUserPreferencesStore, useSyncQueueStore, startSyncOnForeground, useSubscriptionStore } from '@kiaanverse/store';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useNotifications } from '../hooks/useNotifications';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { NotificationToast } from '../components/common/NotificationToast';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ToastContainer } from '../components/common/Toast';
import { initErrorTracking } from '../services/errorTracking';

// Register background tasks at module level (required by expo-task-manager)
import '../services/backgroundTasks';

// Initialize error tracking before any providers mount
initErrorTracking();

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
      await api.moods.create(item.payload as { score: number; tags?: string[]; note?: string });
      break;
    case 'journey_step': {
      const { journeyId, dayIndex } = item.payload as { journeyId: string; dayIndex: number };
      await api.journeys.completeStep(journeyId, dayIndex);
      break;
    }
    case 'chat_message': {
      const { message, sessionId } = item.payload as { message: string; sessionId?: string };
      await api.chat.send(message, sessionId);
      break;
    }
    case 'journal': {
      await api.journal.create(item.payload as { content_encrypted: string; tags?: string[] });
      break;
    }
    case 'sadhana': {
      await api.sadhana.complete(item.payload as { mood_score?: number; verse_id?: string; reflection?: string; intention?: string });
      break;
    }
    case 'community_post': {
      const { content, circleId, tags } = item.payload as { content: string; circleId?: string; tags?: string[] };
      await api.community.createPost(content, circleId, tags);
      break;
    }
    case 'community_reaction': {
      const { postId, reaction } = item.payload as { postId: string; reaction: string };
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

function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { status, isOnboarded, hasHydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;
    // Wait for Zustand persist to finish rehydrating isOnboarded from storage.
    // Without this, isOnboarded is stale (false) for a few frames after
    // initialize() resolves, causing a flash redirect to /onboarding.
    if (!hasHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (status === 'authenticated' && isOnboarded && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/home');
    }
  }, [status, isOnboarded, hasHydrated, segments, router]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// App Content — splash screen + status bar + auth gate + offline banner
// ---------------------------------------------------------------------------

function AppContent(): React.JSX.Element {
  const { theme } = useTheme();
  const { status, initialize, checkBiometricAvailability } = useAuthStore();
  const hydrateSubscription = useSubscriptionStore((s) => s.hydrate);
  const { isOnline } = useNetworkStatus();
  const pendingCount = useSyncQueueStore((s) => s.queue.length);
  const processQueue = useSyncQueueStore((s) => s.processQueue);
  const wasOffline = useRef(false);

  const onLayoutReady = useCallback(async () => {
    if (status !== 'idle' && status !== 'loading') {
      await SplashScreen.hideAsync();
    }
  }, [status]);

  useEffect(() => {
    const setup = async () => {
      await initialize();
      await checkBiometricAvailability();
      await hydrateSubscription();
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
      <View style={[styles.loading, { backgroundColor: colors.background.dark }]}>
        <LoadingMandala size={120} />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayoutReady}>
      <StatusBar style={theme.colors.statusBarStyle === 'light-content' ? 'light' : 'dark'} />
      <OfflineBanner isOffline={!isOnline} pendingCount={pendingCount} />
      <NotificationToast />
      <ToastContainer />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="gita" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="wellness" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="chat" />
          <Stack.Screen name="subscription" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />

          {/* Sacred Tools — full-screen modal stacks */}
          <Stack.Screen name="tools" options={{ animation: 'slide_from_right' }} />

          {/* Sacred Journal */}
          <Stack.Screen name="journal" options={{ animation: 'slide_from_right' }} />

          {/* Daily Sadhana */}
          <Stack.Screen name="sadhana" options={{ animation: 'slide_from_right' }} />

          {/* Community & Wisdom Rooms */}
          <Stack.Screen name="community" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="wisdom-rooms" options={{ animation: 'slide_from_right' }} />

          {/* Karma Footprint */}
          <Stack.Screen name="karma-footprint" options={{ animation: 'slide_from_right' }} />

          {/* Analytics & Deep Insights */}
          <Stack.Screen name="analytics" options={{ animation: 'slide_from_right' }} />

          {/* KIAAN Vibe Player */}
          <Stack.Screen name="vibe-player" options={{ animation: 'slide_from_bottom' }} />

          {/* Settings */}
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </AuthGate>
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
        persistOptions={{ persister: queryPersister, maxAge: 1000 * 60 * 60 * 24 }}
      >
        <ThemeProvider mode={mode} onModeChange={setMode}>
          <I18nProvider
            initialLocale={locale as 'en'}
            namespaces={['common', 'navigation', 'errors', 'auth', 'home', 'kiaan', 'journeys', 'tools', 'emotional-reset', 'karma-reset', 'journal', 'sadhana', 'community', 'vibe-player', 'analytics', 'settings']}
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
});
