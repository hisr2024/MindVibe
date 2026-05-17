/**
 * Wisdom Stack — 1:1 mirror of kiaanverse.com/m/wisdom for the Expo app.
 *
 *   /wisdom                         — Wisdom landing (Today's Wisdom + themes)
 *   /wisdom/theme/[themeId]         — Curated verse list for a mood/theme
 *   /wisdom/verse/[chapter]/[verse] — Read More: full verse + voice picker + Listen
 *
 * Both screens render their own DivineScreenWrapper backgrounds so the
 * particle field / aurora persists on push. Slide-from-right matches the
 * cinematic transition used by every other feature stack in the app.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function WisdomLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="theme/[themeId]" />
      <Stack.Screen name="verse/[chapter]/[verse]" />
    </Stack>
  );
}
