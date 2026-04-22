/**
 * Ardha stack layout — input screen and result screen.
 *
 * Matches the web `/m/ardha` flow: no system header (every screen draws
 * its own gold crown header), dark cosmic background, and a fade
 * transition so the result card seems to materialize rather than slide.
 */
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kiaanverse/ui';

export default function ArdhaLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.background.void },
      }}
    />
  );
}
