/**
 * Shlokas Tab — Nested Stack
 *
 * Routes:
 *   /shlokas                       — 18 chapters + daily verse + search
 *   /shlokas/[chapter]             — Chapter detail (verse list)
 *   /shlokas/[chapter]/[verse]     — Full shloka detail
 *
 * Every nested screen is wrapped in DivineScreenWrapper at the screen level
 * so the particle field / aurora persists on route change.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function ShlokasLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[chapter]/index" />
      <Stack.Screen name="[chapter]/[verse]" />
    </Stack>
  );
}
