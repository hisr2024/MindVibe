/**
 * KarmicPatternCard — Selectable card for a Shadripu karmic pattern.
 *
 * Displays Sanskrit name, Romanized transliteration, English translation,
 * description, and emoji icon. Animates with a spring scale and golden
 * border glow when selected.
 *
 * Layout notes:
 * - Sanskrit and Roman are rendered as separate `<Text>` elements so they
 *   wrap independently; a single "काम (Kāma)" string on a narrow card
 *   broke mid-word (split the `K` from `āma`), which looked broken.
 * - Card width comes from the parent rather than being hard-coded to
 *   `'47%'`. Percentage widths on flex children with nested wrappers
 *   resolve against the wrapper rather than the grid, so the old layout
 *   left cards too narrow for the Sanskrit script. The parent now passes
 *   a concrete pixel width computed from the screen size.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

export interface KarmicPattern {
  readonly id: string;
  /** Sanskrit in Devanagari (e.g. `काम`). Rendered on its own line. */
  readonly sanskrit: string;
  /** Romanised transliteration (e.g. `Kāma`). Rendered on a second line. */
  readonly romanName: string;
  /** English translation (e.g. `Desire / Attachment`). */
  readonly english: string;
  readonly icon: string;
  readonly description: string;
}

interface KarmicPatternCardProps {
  readonly pattern: KarmicPattern;
  readonly isSelected: boolean;
  readonly onSelect: (id: string) => void;
  /**
   * Optional style override (the parent supplies a concrete `width` so the
   * two-column grid sits flush against the screen padding). Falls back to
   * the card's intrinsic style — still usable standalone in a row wrap,
   * just not ideal for Devanagari line-wrapping.
   */
  readonly style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function KarmicPatternCard({
  pattern,
  isSelected,
  onSelect,
  style,
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
      style={[styles.card, style, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={`${pattern.sanskrit} ${pattern.romanName} — ${pattern.english}`}
      accessibilityState={{ selected: isSelected }}
    >
      <Text variant="h2" align="center">
        {pattern.icon}
      </Text>
      {/* Sanskrit (Devanagari) and Romanisation on separate lines so each
          stays intact even on narrow screens. */}
      <Text
        variant="label"
        align="center"
        color={isSelected ? colors.primary[300] : colors.text.primary}
      >
        {pattern.sanskrit}
      </Text>
      <Text
        variant="caption"
        align="center"
        color={isSelected ? colors.primary[500] : colors.text.secondary}
        style={styles.romanText}
      >
        {pattern.romanName}
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
  romanText: {
    // Italic transliteration matches the typographic convention used in
    // dictionaries and in the Gita corpus elsewhere in the app.
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
