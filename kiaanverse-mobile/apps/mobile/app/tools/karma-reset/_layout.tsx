/**
 * Karma Reset Stack Layout
 *
 * Headerless stack navigator for the 4-phase sacred ritual flow.
 * Uses fade animation to create a meditative transition between phases.
 * Gesture navigation is disabled to prevent accidental exits mid-ritual.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kiaanverse/ui';

export default function KarmaResetLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.background.dark },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="phases/acknowledgment" />
      <Stack.Screen name="phases/understanding" />
      <Stack.Screen name="phases/release" />
      <Stack.Screen name="phases/renewal" />
    </Stack>
  );
}
