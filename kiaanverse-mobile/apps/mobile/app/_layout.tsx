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
 * Auth gate:
 *   idle/loading → splash screen held
 *   unauthenticated → /(auth)/login
 *   authenticated + !onboarded → /onboarding
 *   authenticated + onboarded → /(tabs)/home
 */

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme, colors, LoadingMandala } from '@kiaanverse/ui';
import { I18nProvider } from '@kiaanverse/i18n';
import { useAuthStore, useThemeStore, useUserPreferencesStore } from '@kiaanverse/store';

// Prevent splash screen from hiding until we're ready
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

// ---------------------------------------------------------------------------
// Auth Gate — redirects based on auth + onboarding state
// ---------------------------------------------------------------------------

function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { status, isOnboarded } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated' && !isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (status === 'authenticated' && isOnboarded && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/home');
    }
  }, [status, isOnboarded, segments, router]);

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// App Content — splash screen + status bar + auth gate
// ---------------------------------------------------------------------------

function AppContent(): React.JSX.Element {
  const { theme } = useTheme();
  const { status, initialize, checkBiometricAvailability } = useAuthStore();

  const onLayoutReady = useCallback(async () => {
    if (status !== 'idle' && status !== 'loading') {
      await SplashScreen.hideAsync();
    }
  }, [status]);

  useEffect(() => {
    const setup = async () => {
      await initialize();
      await checkBiometricAvailability();
    };
    void setup();
    // Run once on mount — Zustand actions are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="chat" />
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
      <QueryClientProvider client={queryClient}>
        <ThemeProvider mode={mode} onModeChange={setMode}>
          <I18nProvider
            initialLocale={locale as 'en'}
            namespaces={['common', 'navigation', 'errors', 'auth', 'home', 'kiaan', 'journeys']}
          >
            <AppContent />
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
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
