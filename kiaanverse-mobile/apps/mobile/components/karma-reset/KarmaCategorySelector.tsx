/**
 * KarmaCategorySelector — 6 category cards in a 2×3 grid.
 *
 * Each card represents a karma type (action, speech, thought, reaction,
 * avoidance, intention) with its Sanskrit label, English description,
 * and category-specific color. Selection triggers a spring scale bump
 * and a light haptic tick.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/KarmaCategorySelector.tsx`.
 */

import React, { useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { KarmaCategory, KarmaCategoryConfig } from './types';
import { KARMA_CATEGORIES } from './types';

interface KarmaCategorySelectorProps {
  selected: KarmaCategory | null;
  onSelect: (category: KarmaCategory) => void;
}

function CategoryCard({
  cat,
  isSelected,
  onPress,
}: {
  cat: KarmaCategoryConfig;
  isSelected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const scale = useSharedValue(1);

  // Subtle "selected" bump: scale to 1.03 while selected, 1 otherwise.
  const selectedScale = useSharedValue(isSelected ? 1.03 : 1);

  React.useEffect(() => {
    selectedScale.value = withSpring(isSelected ? 1.03 : 1, {
      damping: 25,
      stiffness: 400,
    });
  }, [isSelected, selectedScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * selectedScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 80 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  }, [scale]);

  const borderColor = isSelected ? `${cat.color}80` : 'rgba(255,255,255,0.06)';
  const topBorderColor = isSelected ? cat.color : 'rgba(255,255,255,0.06)';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Select ${cat.label} karma — ${cat.description}`}
      accessibilityState={{ selected: isSelected }}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? cat.bg : 'rgba(22,26,66,0.65)',
            borderColor,
            borderTopColor: topBorderColor,
            borderTopWidth: isSelected ? 2 : 1,
            shadowColor: isSelected ? cat.color : 'transparent',
            shadowOpacity: isSelected ? 0.25 : 0,
          },
          animatedStyle,
        ]}
      >
        <Animated.Text
          style={[
            styles.sanskrit,
            { color: isSelected ? cat.color : `${cat.color}CC` },
          ]}
        >
          {cat.sanskrit}
        </Animated.Text>
        <Animated.Text style={styles.label}>{cat.label}</Animated.Text>
        <Animated.Text style={styles.description}>
          {cat.description}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

export function KarmaCategorySelector({
  selected,
  onSelect,
}: KarmaCategorySelectorProps): React.JSX.Element {
  const handleSelect = useCallback(
    (cat: KarmaCategoryConfig) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(cat.id);
    },
    [onSelect]
  );

  return (
    <View>
      <Animated.Text style={styles.sectionLabel}>
        What kind of karma are you bringing?
      </Animated.Text>
      <View style={styles.grid}>
        {KARMA_CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.cell}>
            <CategoryCard
              cat={cat}
              isSelected={selected === cat.id}
              onPress={() => handleSelect(cat)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    color: '#6B6355',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  cell: {
    width: '50%',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  pressable: {
    width: '100%',
  },
  card: {
    minHeight: 86,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
  },
  sanskrit: {
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '300',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B8AE98',
    marginTop: 2,
  },
  description: {
    fontSize: 10,
    fontWeight: '300',
    color: '#6B6355',
    marginTop: 1,
  },
});
