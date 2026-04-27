/**
 * Voice subtree layout — modal presentations for the overlays so they
 * slide up over the canvas.
 */

import { Stack } from 'expo-router';
import { Color } from '../../lib/theme';

export default function VoiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Color.cosmicVoid },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sakha' }} />
      <Stack.Screen name="transcript" options={{ presentation: 'modal' }} />
      <Stack.Screen name="quota" options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="crisis"
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
