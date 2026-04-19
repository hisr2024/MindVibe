/**
 * Tabs Layout — 5-tab bottom navigation with custom golden tab bar.
 *
 * Home | Sakha (✦) | Journeys | Gita | Profile
 *
 * Features:
 * - Custom tab bar with golden active dot + haptic feedback
 * - Fade transitions between tabs
 * - freezeOnBlur preserves tab state (scroll position, form data, chat context)
 *
 * Deep link routes (hidden from tab bar):
 * - verse/[chapter]/[verse] → kiaanverse://verse/:chapter/:verse
 * - journey/[id] → kiaanverse://journey/:id (nested inside journey tab)
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from '@kiaanverse/i18n';
import { CustomTabBar } from '../../components/CustomTabBar';

export default function TabsLayout(): React.JSX.Element {
  const { t } = useTranslation('navigation');

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('home') }}
      />
      <Tabs.Screen
        name="sakha"
        options={{ title: t('sakha') }}
      />
      <Tabs.Screen
        name="journey"
        options={{ title: t('journey') }}
      />
      <Tabs.Screen
        name="gita"
        options={{ title: t('gita') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('profile') }}
      />

      {/* Deep link screens — hidden from tab bar */}
      <Tabs.Screen
        name="verse/[chapter]/[verse]"
        options={{ href: null }}
      />
      {/* New Sakha chat screen (1:1 web port). Hidden from the tab bar
          until the center tab is officially migrated away from sakha.tsx. */}
      <Tabs.Screen
        name="kiaan"
        options={{ href: null }}
      />
      {/* Shlokas — 1:1 port of /m/gita (chapters + daily verse + search).
          Registered as a deep-linkable stack hidden from the tab bar;
          reachable via router.push('/(tabs)/shlokas'). */}
      <Tabs.Screen
        name="shlokas"
        options={{ href: null }}
      />
    </Tabs>
  );
}
