/**
 * Journey Tab — Nested Stack
 *
 * Allows navigation from the journey catalog to a journey detail
 * and into the immersive step player.
 *
 * Routes:
 *   /journey           — Journey catalog (index)
 *   /journey/[id]      — Journey detail with day selector
 *   /journey/step/[day] — Immersive daily step player
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function JourneyLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="step/[day]" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
