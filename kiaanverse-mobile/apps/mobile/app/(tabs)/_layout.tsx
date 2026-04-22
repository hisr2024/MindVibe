/**
 * Tabs Layout — 5-tab bottom navigation for Kiaanverse.
 *
 *   Home · Sakha · Journeys · Journal · Profile
 *
 * Shlokas used to live in slot 3 and Journeys was buried as a sub-tab of
 * Journal; the layout promotes Journeys to a top-level destination and
 * keeps Shlokas reachable via deep-links (from the Vibe Player's Daily
 * Verse banner, notifications, etc.) while removing it from the tab bar.
 *
 * - Uses the custom DivineTabBar (gold-accented, dark navy background).
 * - `freezeOnBlur` preserves tab state (scroll positions, chat history,
 *   journal drafts) when the user switches tabs.
 * - Deep-link routes (`/journey/...`, `/verse/...`, `/journal/new`, etc.)
 *   live outside the (tabs) group and are pushed with the Expo Router
 *   stack, not rendered in the tab bar.
 * - `shlokas` is registered with `href: null` so its route is still valid
 *   (every existing `router.push('/(tabs)/shlokas/...')` call in the app
 *   keeps working) but it doesn't render in the bottom bar.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from '@kiaanverse/i18n';

import { DivineTabBar } from '../../components/navigation/DivineTabBar';

export default function TabsLayout(): React.JSX.Element {
  const { t } = useTranslation('navigation');

  return (
    <Tabs
      tabBar={(props) => <DivineTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="chat" options={{ title: t('chat') }} />
      <Tabs.Screen name="journeys" options={{ title: t('journeys') }} />
      <Tabs.Screen name="journal" options={{ title: t('journal') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
      {/* Hidden from the bottom bar but still routable — see header note. */}
      <Tabs.Screen
        name="shlokas"
        options={{ title: t('shlokas'), href: null }}
      />
    </Tabs>
  );
}
