/**
 * Sakha Voice Companion — root layout.
 *
 * Expo Router file-based root. The full screen tree lands in Part 10:
 *   app/_layout.tsx                ← here (root)
 *   app/index.tsx                  ← landing → routes to /voice
 *   app/voice/_layout.tsx          ← voice subtree
 *   app/voice/index.tsx            ← VoiceCompanionScreen (Shankha + sacred geometry)
 *   app/voice/transcript.tsx      ← VoiceTranscriptOverlay
 *   app/voice/crisis.tsx          ← CrisisOverlay (full-screen)
 *   app/voice/quota.tsx           ← VoiceQuotaSheet
 *   app/voice/onboarding.tsx     ← VoiceOnboarding
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            // COSMIC_VOID — canonical KIAANVERSE backdrop
            contentStyle: { backgroundColor: '#050714' },
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
