/**
 * SectionHeader — uppercase section label for the Tools Dashboard.
 *
 * Visual spec:
 *   [ 2px × 14px gold bar ]  TEXT IN UPPERCASE
 *   Typography: Outfit-SemiBold 11 px, TEXT_MUTED, letterSpacing 0.15 em.
 *
 * The accent bar uses DIVINE_GOLD at full strength; the label stays muted
 * so section titles whisper rather than shout. Entrance is handled by the
 * parent (it wraps the whole row in an Animated.View + useDivineEntrance).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DIVINE_GOLD } from './toolColors';

const TEXT_MUTED = 'rgba(200,191,168,0.75)';

export interface SectionHeaderProps {
  /** Display text — rendered exactly as provided (apply uppercase upstream). */
  readonly title: string;
}

function SectionHeaderInner({ title }: SectionHeaderProps): React.JSX.Element {
  return (
    <View
      style={styles.row}
      accessibilityRole="header"
      accessibilityLabel={title}
    >
      <View style={styles.bar} />
      <Text style={styles.label} numberOfLines={1}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

/** Uppercase section header with a gold accent bar. */
export const SectionHeader = React.memo(SectionHeaderInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    // ↓ Breathing room above so the label clearly belongs to the next card.
    marginTop: 8,
    marginBottom: 10,
  },
  bar: {
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: DIVINE_GOLD,
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    // 0.15 em at 11 px ≈ 1.65 — round to 1.6 for whole-pixel crispness.
    letterSpacing: 1.6,
  },
});
