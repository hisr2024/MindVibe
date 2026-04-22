/**
 * Journeys Tab — standalone षड्रिपु Sacred Journey surface.
 *
 * Previously this content lived inside a "Journeys" sub-tab of the Journal
 * hub, which made the dharma-wheel flow three taps deep. Splitting it into
 * a top-level tab matches the product spec (Home · Sakha · Journeys ·
 * Journal · Profile) and gives the six inner enemies the real estate they
 * deserve.
 *
 * The actual list + empty state + enemy metadata lives in
 * `components/journal/JourneysView.tsx` — we reuse it as-is so the two
 * surfaces (tab + any future embed) stay in sync. When the Journal hub
 * was dismantled, this was the only consumer left.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DivineBackground,
  GoldenHeader,
} from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

import { JourneysView } from '../../components/journal/JourneysView';

export default function JourneysTab(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('navigation');

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GoldenHeader title={t('journeys', 'Journeys')} />
        <JourneysView />
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
});
