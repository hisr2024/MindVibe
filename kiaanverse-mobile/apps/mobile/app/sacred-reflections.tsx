/**
 * Sacred Reflections — unified four-tab encrypted journal experience.
 *
 * 1:1 adoption of the Kiaanverse.com mobile web surface:
 *   • EDITOR  (लेख)  — compose a reflection with mood + tags, AES-256-GCM
 *                      encrypted on-device before leaving the handset.
 *   • BROWSE  (पठन)  — read the sacred library: weekly strip, stat cards,
 *                      mood filters, search.
 *   • KIAAN   (बोध)  — Sakha's weekly reflection (KarmaLytix Sacred Mirror)
 *                      rendered from plaintext metadata only.
 *   • CALENDAR (तिथि) — monthly grid with current & longest streaks.
 *
 * The four sub-tabs share composer state (draft body / mood / tags) through
 * local hook scope so the user can tap between tabs without losing their
 * work. Encrypted bodies never leave the device un-sealed; server sees only
 * opaque ciphertext plus plaintext mood + tag metadata.
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DivineBackground,
  GoldenHeader,
  Text,
  colors,
  spacing,
} from '@kiaanverse/ui';

import { SacredTabBar } from '../components/sacred-reflections/SacredTabBar';
import {
  COPY,
  type SacredTab,
} from '../components/sacred-reflections/constants';
import { EditorTab } from '../components/sacred-reflections/EditorTab';
import { BrowseTab } from '../components/sacred-reflections/BrowseTab';
import { KiaanTab } from '../components/sacred-reflections/KiaanTab';
import { CalendarTab } from '../components/sacred-reflections/CalendarTab';

export default function SacredReflectionsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SacredTab>('editor');

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GoldenHeader title={COPY.heading} />
        <Text
          variant="caption"
          color={colors.primary[500]}
          style={styles.headerSanskrit}
        >
          {COPY.headingSanskrit}
        </Text>
        <SacredTabBar active={activeTab} onChange={setActiveTab} />

        <View style={styles.tabContent}>
          {activeTab === 'editor' && (
            <EditorTab onSaved={() => setActiveTab('browse')} />
          )}
          {activeTab === 'browse' && (
            <BrowseTab onOpenEditor={() => setActiveTab('editor')} />
          )}
          {activeTab === 'kiaan' && (
            <KiaanTab onOpenEditor={() => setActiveTab('editor')} />
          )}
          {activeTab === 'calendar' && <CalendarTab />}
        </View>
      </View>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  headerSanskrit: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
});
