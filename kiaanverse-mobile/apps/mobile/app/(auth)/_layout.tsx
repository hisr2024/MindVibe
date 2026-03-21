/**
 * Auth Group Layout
 *
 * Stack navigator for login and register screens.
 * No header, dark background.
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@kiaanverse/ui';

export default function AuthLayout(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
