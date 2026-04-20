/**
 * Subscription subroute layout.
 *
 * Groups index (current subscription), plans, and success under a single
 * stack so back navigation inside the flow feels like one coherent
 * journey rather than jumping between top-level routes.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function SubscriptionStackLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 280,
      }}
    />
  );
}
