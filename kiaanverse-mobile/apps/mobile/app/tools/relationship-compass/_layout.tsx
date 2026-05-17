/**
 * Relationship Compass layout — single-screen stack hosting the
 * Sambandha-Dharma 6-chamber flow. The orchestrator (index.tsx) renders
 * its own progress flames + back button, so we keep the system header
 * hidden and disable swipe-to-go-back to prevent accidental exits while
 * the user is mid-ritual.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kiaanverse/ui';

export default function RelationshipCompassLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.background.dark },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
