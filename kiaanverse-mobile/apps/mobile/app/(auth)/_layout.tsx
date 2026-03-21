/**
 * Auth Group Layout
 *
 * Stack navigator for login, register, and forgot-password screens.
 * No header, dark background, slide transitions.
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
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
