/**
 * Tabs Layout — 5-tab bottom navigation for Kiaanverse.
 *
 *   Home · Chat · Shlokas · Journal · Profile
 *
 * - Uses the custom DivineTabBar (gold-accented, dark navy background).
 * - `freezeOnBlur` preserves tab state (scroll positions, chat history,
 *   journal drafts) when the user switches tabs.
 * - Deep-link routes (`/journey/...`, `/verse/...`, `/journal/new`, etc.)
 *   live outside the (tabs) group and are pushed with the Expo Router
 *   stack, not rendered in the tab bar.
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
      <Tabs.Screen name="shlokas" options={{ title: t('shlokas') }} />
      <Tabs.Screen name="journal" options={{ title: t('journal') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  );
}
