/**
 * Journeys Tab — षड्रिपु Sacred Journeys 4-sub-tab hub.
 *
 * Hosts the JourneysHub orchestrator which renders Today / Journeys /
 * Battleground / Wisdom inside a single full-screen surface, mirroring
 * the kiaanverse.com mobile experience 1:1.
 *
 * The hub manages its own footer sub-tab bar; the parent app's bottom
 * navigation (Home · Sakha · Shlokas · Journeys · Profile) sits below it.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { JourneysHub } from '../../components/journey/hub/JourneysHub';

export default function JourneysTab(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <JourneysHub />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050714',
  },
});
