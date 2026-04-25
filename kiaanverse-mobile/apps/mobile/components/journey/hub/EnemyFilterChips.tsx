/**
 * EnemyFilterChips — Round Hindi enemy filter pills for the Journeys
 * (Browse) sub-tab.
 *
 * Renders: All · काम · क्रोध · लोभ · मोह · मद · मात्सर्य
 *
 * Selected chip fills with the enemy's accent colour (gold for All).
 * Mirrors the web mobile filter row 1:1.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing } from '@kiaanverse/ui';

import {
  ENEMY_INFO,
  ENEMY_ORDER,
  type EnemyKey,
  enemyAlpha,
} from '../enemyInfo';

export type EnemyFilter = 'all' | EnemyKey;

export function EnemyFilterChips({
  value,
  onChange,
}: {
  readonly value: EnemyFilter;
  readonly onChange: (next: EnemyFilter) => void;
}): React.JSX.Element {
  const select = (next: EnemyFilter): void => {
    if (next === value) return;
    Haptics.selectionAsync().catch(() => undefined);
    onChange(next);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      <Chip
        label="All"
        selected={value === 'all'}
        accent={colors.divine.aura}
        onPress={() => select('all')}
      />
      {ENEMY_ORDER.map((key) => {
        const info = ENEMY_INFO[key];
        return (
          <Chip
            key={key}
            label={info.devanagari}
            selected={value === key}
            accent={info.color}
            onPress={() => select(key)}
          />
        );
      })}
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  accent,
  onPress,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly accent: string;
  readonly onPress: () => void;
}): React.JSX.Element {
  // Encode the accent into an EnemyKey-like for the alpha helper. We pass
  // null and override the rgb manually via inline rgba.
  const bg = selected ? accent : 'rgba(255,255,255,0.04)';
  const borderColor = selected ? accent : enemyAlpha(null, 0.18);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: bg,
          borderColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.chipInner}>
        <Text
          variant="label"
          color={selected ? '#050714' : accent}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  chip: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
