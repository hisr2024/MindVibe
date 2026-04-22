/**
 * Karma Reset Stack Layout
 *
 * Headerless, gesture-locked stack for the 6-phase ritual. The whole
 * experience lives inside `index.tsx` as a single immersive screen —
 * we still use a Stack here (rather than a bare <Slot />) so Expo
 * Router's type-checking of `router.push('/tools/karma-reset')` stays
 * happy and so a future follow-up screen (e.g. a shareable seal
 * certificate) can be added without restructuring.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function KarmaResetLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        gestureEnabled: false,
        contentStyle: { backgroundColor: '#050714' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
