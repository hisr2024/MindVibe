/**
 * Journey Tab — Nested Stack
 *
 * Allows navigation from the journey catalog to a journey detail
 * via deep link: kiaanverse://journey/:id
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function JourneyLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
