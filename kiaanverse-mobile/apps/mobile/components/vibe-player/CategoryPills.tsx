/**
 * CategoryPills — horizontal-scroll filter strip for the Vibe library.
 *
 * Six pills: All · Mantras · Meditation · Gita Shlokas · Bhajans · Binaural.
 * Active pill: LinearGradient Krishna-aura, Outfit-SemiBold 12 px WHITE.
 * Inactive pill: SacredCard-compact dark surface, TEXT_MUTED label.
 *
 * The API's `MeditationTrack.category` is a closed literal, so several
 * display categories share the same query filter. We keep that mapping
 * here (the component emits a `FilterKey` that the library screen can
 * resolve into an API filter string).
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

/** User-visible filter keys. */
export type FilterKey =
  | 'all'
  | 'mantras'
  | 'meditation'
  | 'shlokas'
  | 'bhajans'
  | 'binaural';

/** Display label + ordering for every pill. */
const PILLS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'mantras', label: 'Mantras' },
  { key: 'meditation', label: 'Meditation' },
  { key: 'shlokas', label: 'Gita Shlokas' },
  { key: 'bhajans', label: 'Bhajans' },
  { key: 'binaural', label: 'Binaural' },
];

/**
 * Map a user-facing filter key into the API's `category` string. Several
 * display categories share an API category until the backend is split.
 */
export function resolveApiCategory(key: FilterKey): string | undefined {
  switch (key) {
    case 'all':
      return undefined;
    case 'mantras':
      return 'mantra';
    case 'meditation':
      return 'meditation';
    case 'shlokas':
    case 'bhajans':
      return 'chanting';
    case 'binaural':
      return 'ambient';
  }
}

const GOLD = '#D4A017';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.8)';
const KRISHNA_AURA = [
  'rgba(27,79,187,0.95)',
  'rgba(66,41,155,0.9)',
  'rgba(212,160,23,0.85)',
] as const;

export interface CategoryPillsProps {
  /** Active filter key. */
  readonly value: FilterKey;
  /** Called when the user chooses a different filter. */
  readonly onChange: (key: FilterKey) => void;
  /** Optional style override for the outer ScrollView. */
  readonly style?: ViewStyle;
}

function CategoryPillsInner({
  value,
  onChange,
  style,
}: CategoryPillsProps): React.JSX.Element {
  const handlePress = useCallback(
    (key: FilterKey) => {
      if (key === value) return;
      void Haptics.selectionAsync();
      onChange(key);
    },
    [value, onChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={[styles.scroll, style]}
      // Let the user scroll even while the active pill animates.
      keyboardShouldPersistTaps="handled"
    >
      {PILLS.map((pill) => {
        const active = pill.key === value;
        return (
          <Pressable
            key={pill.key}
            onPress={() => handlePress(pill.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Filter by ${pill.label}`}
            style={styles.pressable}
          >
            <View style={[styles.pill, active && styles.pillActive]}>
              {active ? (
                <LinearGradient
                  colors={KRISHNA_AURA as unknown as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
              >
                {pill.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Horizontal six-pill filter row for the Vibe library. */
export const CategoryPills = React.memo(CategoryPillsInner);

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  pressable: {
    height: 40,
  },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    backgroundColor: 'rgba(17,20,53,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minWidth: 64,
  },
  pillActive: {
    borderColor: 'rgba(212,160,23,0.55)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  labelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: SACRED_WHITE,
    letterSpacing: 0.3,
  },
});
