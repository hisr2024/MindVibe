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
    </Tabs>
  );
}
