/**
 * Tabs Layout — 5-tab bottom navigation for Kiaanverse.
 *
 *   Home · Sakha · Shlokas · Journal · Profile
 *
 * Shlokas owns slot 3 as a Sacred Hub — every sacred instrument the user
 * has (Gita scriptures, healing + wisdom tools, Wisdom Rooms, Sacred
 * Reflections, KIAAN Vibe Player) is one tap away from this tab's root
 * screen. The full shloka browser lives at `/shlokas/gita`, with existing
 * deep-link routes `/shlokas/[chapter]/[verse]` untouched.
 *
 * Journeys is still a first-class route (reachable from Home's "Browse
 * Sacred Catalog" CTA and from notifications), but it is `href: null`'d
 * here so the bottom bar stays at five doorways and the Shlokas Hub is
 * the home for exploration.
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
      {/* Routable but hidden from the global bar — the journeys hub uses
          its own internal 4-sub-tab footer (Today / Journeys / Battleground
          / Wisdom), and is reached from Home's "Browse Sacred Catalog" CTA
          and from the route /(tabs)/journeys. */}
      <Tabs.Screen
        name="journeys"
        options={{ title: t('journeys'), href: null }}
      />
    </Tabs>
  );
}
