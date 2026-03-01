/**
 * MindVibe Mobile — App Entry Point
 *
 * Configures providers, navigation, and persistent overlays.
 * The KIAAN AI Ecosystem is consumed via API — never mutated.
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { BottomTabBar } from '@components/navigation/BottomTabBar';
import { VibePlayer, setupVibePlayer } from '@components/vibe-player/VibePlayer';
import { useVibePlayerStore } from '@state/stores/vibePlayerStore';
import { featureFlags } from '@config/featureFlags';
import { darkTheme } from '@theme/tokens';
import type { RootStackParamList, MainTabParamList } from '@types/index';

// ---------------------------------------------------------------------------
// Navigation Setup
// ---------------------------------------------------------------------------

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens (implemented in respective screen files)
function HomeScreen() {
  return <View style={styles.placeholder} />;
}
function JourneysScreen() {
  return <View style={styles.placeholder} />;
}
function VibeScreen() {
  return <View style={styles.placeholder} />;
}
function SakhaScreen() {
  return <View style={styles.placeholder} />;
}
function ProfileScreen() {
  return <View style={styles.placeholder} />;
}
function AuthScreen() {
  return <View style={styles.placeholder} />;
}
function OnboardingScreen() {
  return <View style={styles.placeholder} />;
}

// ---------------------------------------------------------------------------
// Main Tab Navigator
// ---------------------------------------------------------------------------

function MainTabs() {
  const { isExpanded, isPlayerVisible, toggleExpanded } = useVibePlayerStore();
  const theme = darkTheme;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="HomeTab" component={HomeScreen} />
        <Tab.Screen name="JourneysTab" component={JourneysScreen} />
        <Tab.Screen name="VibeTab" component={VibeScreen} />
        <Tab.Screen name="SakhaTab" component={SakhaScreen} />
        <Tab.Screen name="ProfileTab" component={ProfileScreen} />
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
  },
});

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const theme = darkTheme;

  useEffect(() => {
    async function bootstrap() {
      // Initialize Track Player for audio playback
      await setupVibePlayer();

      // Initialize feature flags
      // In production: await featureFlags.initialize(userId, userTier);

      setIsReady(true);
    }

    bootstrap();
  }, []);

  if (!isReady) {
    // Splash screen is shown natively until ready
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            barStyle={theme.statusBarStyle}
            backgroundColor="transparent"
            translucent
          />
          <NavigationContainer>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
              {/* Auth flow */}
              <RootStack.Screen name="Auth" component={AuthScreen} />
              {/* Onboarding (first launch) */}
              <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
              {/* Main app */}
              <RootStack.Screen name="Main" component={MainTabs} />
            </RootStack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
});
