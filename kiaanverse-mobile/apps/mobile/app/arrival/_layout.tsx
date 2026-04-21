/**
 * Arrival Ceremony Layout — the 5-page darshan presented on first launch
 * before the authentication flow. Each navigation in / out of this group
 * fades rather than slides, to preserve the sacred quality.
 */
import React from 'react';
import { Stack } from 'expo-router';

export default function ArrivalLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 400,
        contentStyle: { backgroundColor: '#050714' },
      }}
    />
  );
}
