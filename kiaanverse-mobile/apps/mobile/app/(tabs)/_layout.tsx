/**
 * Tabs Layout — 6-tab bottom navigation for Kiaanverse.
 *
 *   Home · Sakha · Sacred Tools · Journeys · Journal · Profile
 *
 * Sacred Tools (slot 3) is the Hub — every sacred instrument the user
 * has (Gita scriptures, healing + wisdom tools, Wisdom Rooms, Sacred
 * Reflections, KIAAN Voice Companion, Vibe Player) is one tap away from
 * this tab's root screen. The full shloka browser lives at
 * `/shlokas/gita`, with existing deep-link routes
 * `/shlokas/[chapter]/[verse]` untouched.
 *
 * Journeys (slot 4) is now first-class on the bar — षड्रिपु, the inner
 * battlefield, is too central to bury behind a CTA. Its hub uses an
 * internal 4-sub-tab footer (Today / Journeys / Battleground / Wisdom)
 * once the user steps inside.
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
      <Tabs.Screen name="journeys" options={{ title: t('journeys') }} />
      <Tabs.Screen name="journal" options={{ title: t('journal') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  );
}
