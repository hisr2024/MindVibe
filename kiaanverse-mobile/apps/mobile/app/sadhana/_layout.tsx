/**
 * Sadhana Stack Layout
 *
 * Provides a headerless Stack navigator for Daily Sadhana sub-routes
 * (daily practice flow, history) with slide-from-right transitions.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function SadhanaLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
