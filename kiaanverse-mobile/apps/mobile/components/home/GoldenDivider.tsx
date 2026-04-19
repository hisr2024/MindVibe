/**
 * GoldenDivider — thin horizontal line that fades in gold from the centre.
 *
 * Separates Sanskrit from translation in the Daily Verse card. Uses
 * expo-linear-gradient for a centre-bright, edge-transparent bloom that
 * matches the web Shlokacard divider.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@kiaanverse/ui';

export interface GoldenDividerProps {
  readonly marginY?: number | undefined;
}

export function GoldenDivider({ marginY }: GoldenDividerProps): React.JSX.Element {
  return (
    <View style={[styles.wrap, { marginVertical: marginY ?? spacing.md }]}>
      <LinearGradient
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        colors={[
          'rgba(212, 160, 23, 0)',
          'rgba(212, 160, 23, 0.55)',
          'rgba(212, 160, 23, 0)',
        ]}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  line: {
    height: StyleSheet.hairlineWidth * 2,
  },
});
