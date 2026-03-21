/**
 * Onboarding Group Layout
 *
 * Stack navigator with no header for the onboarding flow.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@kiaanverse/ui';

export default function OnboardingLayout(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
