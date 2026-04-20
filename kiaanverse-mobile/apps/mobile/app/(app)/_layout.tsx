/**
 * (app) Group Layout — Profile sub-screens.
 *
 * Houses settings screens linked from the Profile tab:
 * notifications, language-settings, edit-profile, change-password,
 * subscription, billing-history, karmalytix, help, contact, privacy,
 * terms, data-privacy. Uses the default fade animation inherited from
 * the root stack.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AppGroupLayout(): React.JSX.Element {
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
