/**
 * MindVibe Mobile — App Entry Point
 *
 * Production-grade React Native application with:
 * - Conditional auth flow (login/signup/onboarding → main app)
 * - 5-tab bottom navigation with nested stack navigators
 * - Persistent Vibe Player overlay
 * - WatermelonDB initialization
 * - Push notification setup
 * - Secure token management via Keychain
 * - TanStack Query for server state
 * - Zustand for local state
 *
 * The KIAAN AI Ecosystem is consumed via API — never mutated.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';

import { BottomTabBar } from '@components/navigation/BottomTabBar';
import { VibePlayer, setupVibePlayer } from '@components/vibe-player/VibePlayer';
import { useVibePlayerStore } from '@state/stores/vibePlayerStore';
import { useAuthStore } from '@state/stores/authStore';
import { useUserPreferencesStore } from '@state/stores/userPreferencesStore';
import { database } from '@database/index';
import { darkTheme, lightTheme, colors, typography, spacing } from '@theme/tokens';
import { useTheme } from '@hooks/useTheme';
import { initializePushNotifications } from '@services/pushNotifications';

// Screens — Auth
import { WelcomeScreen } from '@screens/auth/WelcomeScreen';
import { LoginScreen } from '@screens/auth/LoginScreen';
import { SignupScreen } from '@screens/auth/SignupScreen';
import { OnboardingScreen } from '@screens/OnboardingScreen';

// Screens — Main
import { HomeScreen } from '@screens/HomeScreen';
import { JourneysScreen } from '@screens/JourneysScreen';
import { JourneyDetailScreen } from '@screens/JourneyDetailScreen';
import { VibeLibraryScreen } from '@screens/VibeLibraryScreen';
import { SakhaChatScreen } from '@screens/SakhaChatScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { JournalScreen } from '@screens/JournalScreen';
import { GitaBrowserScreen } from '@screens/GitaBrowserScreen';
import { EmotionalResetScreen } from '@screens/EmotionalResetScreen';

import type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  JourneyStackParamList,
  VibeStackParamList,
  SakhaStackParamList,
  ProfileStackParamList,
} from '@app-types/index';

// ---------------------------------------------------------------------------
// Navigation Setup
// ---------------------------------------------------------------------------

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const JourneyStack = createNativeStackNavigator<JourneyStackParamList>();
const VibeStack = createNativeStackNavigator<VibeStackParamList>();
const SakhaStack = createNativeStackNavigator<SakhaStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const SCREEN_OPTIONS = { headerShown: false } as const;

// ---------------------------------------------------------------------------
// Stack Navigators (per tab)
// ---------------------------------------------------------------------------

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={SCREEN_OPTIONS}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={SCREEN_OPTIONS}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="VerseDetail" component={GitaBrowserScreen} />
      <HomeStack.Screen name="Insights" component={EmotionalResetScreen} />
    </HomeStack.Navigator>
  );
}

function JourneyStackNavigator() {
  return (
    <JourneyStack.Navigator screenOptions={SCREEN_OPTIONS}>
      <JourneyStack.Screen name="JourneyCatalog" component={JourneysScreen} />
      <JourneyStack.Screen name="JourneyDetail" component={JourneyDetailScreen} />
    </JourneyStack.Navigator>
  );
}

function VibeStackNavigator() {
  return (
    <VibeStack.Navigator screenOptions={SCREEN_OPTIONS}>
      <VibeStack.Screen name="VibePlayer" component={VibeLibraryScreen} />
    </VibeStack.Navigator>
  );
}

function SakhaStackNavigator() {
  return (
    <SakhaStack.Navigator screenOptions={SCREEN_OPTIONS}>
      <SakhaStack.Screen name="SakhaCompanion" component={SakhaChatScreen} />
    </SakhaStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={SCREEN_OPTIONS}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Journal" component={JournalScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Analytics" component={GitaBrowserScreen} />
      <ProfileStack.Screen name="Privacy" component={SettingsScreen} />
    </ProfileStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Main Tab Navigator
// ---------------------------------------------------------------------------

function MainTabs() {
  const { isExpanded, isPlayerVisible, toggleExpanded } = useVibePlayerStore();
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={SCREEN_OPTIONS}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNavigator} />
        <Tab.Screen name="JourneysTab" component={JourneyStackNavigator} />
        <Tab.Screen name="VibeTab" component={VibeStackNavigator} />
        <Tab.Screen name="SakhaTab" component={SakhaStackNavigator} />
        <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} />
      </Tab.Navigator>

      {/* Persistent Mini Vibe Player — floats above tab bar */}
      {isPlayerVisible && (
        <VibePlayer
          isExpanded={isExpanded}
          onToggleExpand={toggleExpanded}
          theme={theme}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TanStack Query Client
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ---------------------------------------------------------------------------
// App Content (handles auth routing)
// ---------------------------------------------------------------------------

function AppContent() {
  const { status, isOnboarded } = useAuthStore();
  const { theme } = useTheme();

  // Loading state
  if (status === 'idle' || status === 'loading') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingLogo, { color: theme.accent }]}>🕉️</Text>
        <Text style={[styles.loadingText, { color: theme.accent }]}>MindVibe</Text>
        <ActivityIndicator
          style={styles.loadingSpinner}
          size="small"
          color={theme.accent}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={SCREEN_OPTIONS}>
        {status === 'unauthenticated' ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : !isOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

// ---------------------------------------------------------------------------
// App Root
// ---------------------------------------------------------------------------

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const initialize = useAuthStore((s) => s.initialize);
  const hydrate = useUserPreferencesStore((s) => s.hydrate);
  const { theme } = useTheme();

  useEffect(() => {
    async function bootstrap() {
      // 1. Hydrate preferences from MMKV
      hydrate();

      // 2. Initialize audio player
      await setupVibePlayer();

      // 3. Initialize auth (checks for stored tokens)
      await initialize();

      // 4. Initialize push notifications (after auth)
      try {
        await initializePushNotifications((data) => {
          // Handle notification navigation
          console.info('[App] Notification navigation:', data);
        });
      } catch {
        // Push notifications are non-critical
        console.warn('[App] Push notification setup failed (non-critical)');
      }

      setIsReady(true);
    }

    bootstrap();
  }, [initialize, hydrate]);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: darkTheme.background }]}>
        <Text style={styles.splashEmoji}>🕉️</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider database={database}>
          <QueryClientProvider client={queryClient}>
            <StatusBar
              barStyle={theme.statusBarStyle}
              backgroundColor="transparent"
              translucent
            />
            <AppContent />
          </QueryClientProvider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  loadingSpinner: {
    marginTop: spacing.xl,
  },
  splashEmoji: {
    fontSize: 64,
  },
});
