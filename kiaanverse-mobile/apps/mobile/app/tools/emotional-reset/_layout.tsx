/**
 * Emotional Reset Layout — Full-screen modal stack for the 7-step healing flow.
 * Prevents accidental back navigation during active session.
 */
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kiaanverse/ui';

export default function EmotionalResetLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.background.dark },
        gestureEnabled: false,
      }}
    />
  );
}
