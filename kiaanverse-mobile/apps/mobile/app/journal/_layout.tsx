/**
 * Journal Stack Layout
 *
 * Provides a headerless Stack navigator for Sacred Journal sub-routes
 * (entry list, new entry, entry detail) with slide-from-right transitions.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function JournalLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
