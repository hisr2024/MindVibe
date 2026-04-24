/**
 * Shlokas Tab — Nested Stack
 *
 * Routes:
 *   /shlokas                       — Sacred Hub (scriptures + tools + community)
 *   /shlokas/gita                  — 18 chapters + daily verse + search
 *   /shlokas/[chapter]             — Chapter detail (verse list)
 *   /shlokas/[chapter]/[verse]     — Full shloka detail
 *
 * The `gita` screen is the former `index.tsx` — renamed so the tab root
 * can host the Sacred Hub while every existing deep-link to a chapter or
 * verse (from Daily Verse banners, notifications, share URLs) keeps
 * resolving against `[chapter]/[verse]` without modification.
 *
 * Every nested screen is wrapped in DivineScreenWrapper at the screen level
 * so the particle field / aurora persists on route change.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function ShlokasLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="gita" />
      <Stack.Screen name="[chapter]/index" />
      <Stack.Screen name="[chapter]/[verse]" />
    </Stack>
  );
}
