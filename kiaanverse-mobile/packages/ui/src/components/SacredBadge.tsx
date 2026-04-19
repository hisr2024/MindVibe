/**
 * SacredBadge — Status chip with gold border.
 *
 * Web parity:
 * - Pill with 1px gold border (rgba(212,160,23,0.35)).
 * - Soft gold-tinted background.
 * - Label in Outfit-Medium 11px uppercase, letter-spaced.
 * - Semantic tone props adjust hue without abandoning the gold aesthetic.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

export type SacredBadgeTone = 'default' | 'success' | 'warning' | 'error' | 'info';

const TONES: Record<
  SacredBadgeTone,
  { readonly border: string; readonly bg: string; readonly text: string }
> = {
  default: {
    border: 'rgba(212, 160, 23, 0.35)',
    bg: 'rgba(212, 160, 23, 0.08)',
    text: '#D4A017',
  },
  success: {
    border: 'rgba(61, 139, 94, 0.5)',
    bg: 'rgba(61, 139, 94, 0.15)',
    text: '#7DDFA3',
  },
  warning: {
    border: 'rgba(230, 126, 34, 0.5)',
    bg: 'rgba(230, 126, 34, 0.15)',
    text: '#F3A76B',
  },
  error: {
    border: 'rgba(192, 57, 43, 0.5)',
    bg: 'rgba(192, 57, 43, 0.15)',
    text: '#F08B7D',
  },
  info: {
    border: 'rgba(41, 128, 185, 0.5)',
    bg: 'rgba(41, 128, 185, 0.15)',
    text: '#7DBFE6',
  },
};

export interface SacredBadgeProps {
  /** Badge label text. */
  readonly label: string;
  /** Semantic tone. @default 'default' */
  readonly tone?: SacredBadgeTone;
  /** Leading icon node. */
  readonly icon?: React.ReactNode;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function SacredBadgeInner({
  label,
  tone = 'default',
  icon,
  style,
  testID,
}: SacredBadgeProps): React.JSX.Element {
  const palette = TONES[tone];
  return (
    <View
      style={[
        styles.base,
        {
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[styles.label, { color: palette.text }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/** Status chip with gold (or tinted) border and subtle tinted background. */
export const SacredBadge = React.memo(SacredBadgeInner);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
