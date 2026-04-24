/**
 * Journal Stack Layout
 *
 * Provides a headerless Stack navigator for the Sacred Journal sub-routes
 * that live outside the bottom tab bar: the "new entry" screen and the
 * detail / edit screen. The journal list itself lives inside the tab bar
 * at `app/(tabs)/journal.tsx`, so `/journal` is served by the tabs route
 * and this stack only wraps `/journal/new` and `/journal/:id`.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function JournalLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
