/**
 * Root Layout — Kiaanverse
 *
 * Wraps the entire app in providers and implements the auth gate.
 * - ThemeProvider: dark/light/system theme
 * - I18nProvider: localization
 * - QueryClientProvider: TanStack Query for server state
 * - Auth gate: redirects to (auth) or onboarding based on auth status
 */

import React, { useEffect, useCallback } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme, colors } from '@kiaanverse/ui';
import { I18nProvider } from '@kiaanverse/i18n';
import { useAuthStore } from '@kiaanverse/store';
import { useThemeStore } from '@kiaanverse/store';
import { useUserPreferencesStore } from '@kiaanverse/store';

// Prevent splash screen from hiding until we're ready
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

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

function AppContent(): React.JSX.Element {
  const { theme } = useTheme();
  const { status, initialize } = useAuthStore();

  const onLayoutReady = useCallback(async () => {
    if (status !== 'idle' && status !== 'loading') {
      await SplashScreen.hideAsync();
    }
  }, [status]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background.dark }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayoutReady}>
      <StatusBar style={theme.colors.statusBarStyle === 'light-content' ? 'light' : 'dark'} />
      <AuthGate>
        <Slot />
      </AuthGate>
    </View>
  );
}

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
