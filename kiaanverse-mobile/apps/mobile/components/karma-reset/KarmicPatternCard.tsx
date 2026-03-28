/**
 * KarmicPatternCard — Selectable card for a Shadripu karmic pattern.
 *
 * Displays Sanskrit name, English translation, description, and emoji icon.
 * Animates with a spring scale and golden border glow when selected.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

export interface KarmicPattern {
  readonly id: string;
  readonly sanskrit: string;
  readonly english: string;
  readonly icon: string;
  readonly description: string;
}

interface KarmicPatternCardProps {
  readonly pattern: KarmicPattern;
  readonly isSelected: boolean;
  readonly onSelect: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function KarmicPatternCard({
  pattern,
  isSelected,
  onSelect,
}: KarmicPatternCardProps): React.JSX.Element {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.03 : 1, { damping: 15, stiffness: 150 });
    borderOpacity.value = withSpring(isSelected ? 1 : 0, { damping: 15, stiffness: 150 });
  }, [isSelected, scale, borderOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isSelected ? colors.primary[500] : colors.alpha.whiteLight,
    shadowOpacity: borderOpacity.value * 0.4,
    shadowColor: colors.primary[500],
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  }));

  return (
    <AnimatedPressable
      onPress={() => onSelect(pattern.id)}
      style={[styles.card, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={`${pattern.sanskrit} - ${pattern.english}`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text variant="h2" align="center">
        {pattern.icon}
      </Text>
      <Text variant="label" align="center" color={isSelected ? colors.primary[300] : colors.text.primary}>
        {pattern.sanskrit}
      </Text>
      <Text variant="caption" align="center" color={colors.text.muted}>
        {pattern.english}
      </Text>
      <Text
        variant="bodySmall"
        align="center"
        color={colors.text.secondary}
        numberOfLines={2}
      >
        {pattern.description}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.alpha.whiteLight,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    gap: spacing.xs,
    elevation: 2,
  },
});
