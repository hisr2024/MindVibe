/**
 * Gita Stack Layout
 *
 * Provides a headerless Stack navigator for Gita sub-routes
 * (chapter detail, etc.) that live outside the tab bar.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function GitaLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="chapter/[id]" />
    </Stack>
  );
}
