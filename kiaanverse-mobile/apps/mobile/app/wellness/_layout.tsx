/**
 * Wellness Stack Layout
 *
 * Stack navigator for mood tracking and karma tree screens.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function WellnessLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="mood" />
      <Stack.Screen name="karma" />
    </Stack>
  );
}
