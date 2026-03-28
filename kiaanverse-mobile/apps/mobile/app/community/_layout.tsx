/**
 * Community Stack Layout
 *
 * Provides a headerless Stack navigator for Community sub-routes
 * (feed, circle detail, compose) with slide-from-right transitions.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function CommunityLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="compose" />
      <Stack.Screen name="circles/[id]" />
    </Stack>
  );
}
