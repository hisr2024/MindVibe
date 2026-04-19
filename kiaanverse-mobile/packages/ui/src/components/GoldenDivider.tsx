/**
 * GoldenDivider — Horizontal gradient rule, optional lotus center.
 *
 * Web parity:
 * - 1px height.
 * - Gradient: transparent → gold rings (0.3, 0.5, 0.3) → transparent.
 * - Optional centered glyph ('✦') in gold, 10px.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const DIVIDER_GRADIENT = [
  'rgba(212, 160, 23, 0)',
  'rgba(212, 160, 23, 0.3)',
  'rgba(212, 160, 23, 0.5)',
  'rgba(212, 160, 23, 0.3)',
  'rgba(212, 160, 23, 0)',
] as const;

export interface GoldenDividerProps {
  /** Render a centered lotus glyph atop the rule. @default false */
  readonly withGlyph?: boolean;
  /** Override the centered glyph character. @default '✦' */
  readonly glyph?: string;
  /** Optional style override (e.g. vertical margin). */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function GoldenDividerInner({
  withGlyph = false,
  glyph = '✦',
  style,
  testID,
}: GoldenDividerProps): React.JSX.Element {
  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <LinearGradient
        colors={DIVIDER_GRADIENT as unknown as string[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
      {withGlyph ? (
        <View style={styles.glyphWrap} pointerEvents="none">
          <Text style={styles.glyph}>{glyph}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Horizontal gold gradient divider with optional centered glyph. */
export const GoldenDivider = React.memo(GoldenDividerInner);

const styles = StyleSheet.create({
  wrap: {
    height: 16,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  line: {
    height: 1,
    width: '100%',
  },
  glyphWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: '#D4A017',
    fontSize: 10,
    lineHeight: 12,
    backgroundColor: '#0D1229',
    paddingHorizontal: 6,
  },
});
