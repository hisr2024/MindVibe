/**
 * RipuFilterBar — horizontal ripu filter strip for the Discover screen.
 *
 * Renders an "All" pill followed by one chip per shadripu. Each chip is:
 *   [ colored dot ]  Sanskrit  ·  English
 * with the active chip taking a 1 px border in the ripu's color and a
 * faint tinted background of the same color.
 *
 * The selection is uncontrolled-from-parent's perspective only to keep
 * the API light — the parent owns the current key (`'all'` or a
 * `RipuKey`) and receives changes via `onChange`.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  NEUTRAL_ACCENT,
  RIPUS,
  RIPU_ORDER,
  ripuAlpha,
  type RipuKey,
} from './ripus';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.75)';
const GOLD = '#D4A017';

/** "All" sentinel OR a ripu key — matches the Discover screen's state. */
export type RipuFilterValue = 'all' | RipuKey;

export interface RipuFilterBarProps {
  /** Currently-selected filter. */
  readonly value: RipuFilterValue;
  /** Called when the user taps a different filter chip. */
  readonly onChange: (next: RipuFilterValue) => void;
  /** Optional outer ScrollView style. */
  readonly style?: ViewStyle;
}

interface ChipDescriptor {
  readonly key: RipuFilterValue;
  readonly label: string;
  readonly sanskrit: string | null;
  readonly color: string;
}

/** Build the chip list ONCE — "All" + each ripu in canonical order. */
const CHIPS: readonly ChipDescriptor[] = [
  { key: 'all', label: 'All', sanskrit: null, color: NEUTRAL_ACCENT },
  ...RIPU_ORDER.map<ChipDescriptor>((k) => ({
    key: k,
    label: RIPUS[k].name,
    sanskrit: RIPUS[k].sanskrit,
    color: RIPUS[k].color,
  })),
];

function RipuFilterBarInner({
  value,
  onChange,
  style,
}: RipuFilterBarProps): React.JSX.Element {
  const handlePress = useCallback(
    (next: RipuFilterValue) => {
      if (next === value) return;
      void Haptics.selectionAsync();
      onChange(next);
    },
    [value, onChange]
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={[styles.scroll, style]}
      keyboardShouldPersistTaps="handled"
    >
      {CHIPS.map((chip) => {
        const active = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            onPress={() => handlePress(chip.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter by ${chip.label}`}
            style={[
              styles.chip,
              active && {
                borderColor: chip.color,
                backgroundColor: ripuAlpha(chip.color, 0.16),
              },
            ]}
          >
            <View
              style={[styles.dot, { backgroundColor: chip.color }]}
              pointerEvents="none"
            />
            {chip.sanskrit ? (
              <Text
                style={[styles.sanskrit, active && { color: chip.color }]}
                numberOfLines={1}
              >
                {chip.sanskrit}
              </Text>
            ) : null}
            <Text
              style={[styles.label, active && styles.labelActive]}
              numberOfLines={1}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Horizontal "All + shadripu" filter row. */
export const RipuFilterBar = React.memo(RipuFilterBarInner);

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.18)',
    backgroundColor: 'rgba(17,20,53,0.75)',
    minHeight: 36,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 12,
    color: GOLD,
  },
  label: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  labelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: SACRED_WHITE,
    letterSpacing: 0.2,
  },
});
