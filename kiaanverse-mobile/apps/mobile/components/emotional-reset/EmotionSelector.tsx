/**
 * EmotionSelector — 3x4 grid of emotion cards for the Emotional Reset entry.
 *
 * Each card displays an emoji and label. The selected card receives a golden
 * border glow, spring-scale animation, and haptic feedback. Designed for
 * quick, intuitive emotion identification during moments of distress.
 */

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Pressable as RNPressable,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

export interface Emotion {
  readonly id: string;
  readonly emoji: string;
  readonly label: string;
}

const EMOTIONS: readonly Emotion[] = [
  { id: 'anger', emoji: '\uD83D\uDD25', label: 'Anger' },
  { id: 'anxiety', emoji: '\uD83C\uDF0A', label: 'Anxiety' },
  { id: 'sadness', emoji: '\uD83C\uDF27\uFE0F', label: 'Sadness' },
  { id: 'grief', emoji: '\uD83D\uDD4A\uFE0F', label: 'Grief' },
  { id: 'fear', emoji: '\uD83C\uDF11', label: 'Fear' },
  { id: 'confusion', emoji: '\uD83C\uDF00', label: 'Confusion' },
  { id: 'loneliness', emoji: '\uD83C\uDFD4\uFE0F', label: 'Loneliness' },
  { id: 'shame', emoji: '\uD83C\uDF18', label: 'Shame' },
  { id: 'frustration', emoji: '\u26A1', label: 'Frustration' },
  { id: 'jealousy', emoji: '\uD83D\uDC0D', label: 'Jealousy' },
  { id: 'overwhelm', emoji: '\uD83C\uDF0B', label: 'Overwhelm' },
  { id: 'restlessness', emoji: '\uD83C\uDF43', label: 'Restlessness' },
] as const;

const COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const HORIZONTAL_PAD = spacing.lg * 2;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PAD - CARD_GAP * (COLUMNS - 1)) / COLUMNS;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EmotionSelectorProps {
  readonly selectedEmotion: string | null;
  readonly onSelect: (emotionId: string) => void;
}

// ---------------------------------------------------------------------------
// Single Emotion Card (animated)
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function EmotionCard({
  emotion,
  isSelected,
  onPress,
}: {
  emotion: Emotion;
  isSelected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.05 : 1, { damping: 14, stiffness: 160 });
    borderOpacity.value = withSpring(isSelected ? 1 : 0, { damping: 14, stiffness: 160 });
  }, [isSelected, scale, borderOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: isSelected ? colors.primary[500] : colors.alpha.whiteLight,
    shadowOpacity: borderOpacity.value * 0.5,
    shadowColor: colors.primary[500],
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.card, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={emotion.label}
      accessibilityState={{ selected: isSelected }}
    >
      <Text variant="h2" align="center">
        {emotion.emoji}
      </Text>
      <Text
        variant="caption"
        align="center"
        color={isSelected ? colors.primary[300] : colors.text.secondary}
      >
        {emotion.label}
      </Text>
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export function EmotionSelector({
  selectedEmotion,
  onSelect,
}: EmotionSelectorProps): React.JSX.Element {
  const handleSelect = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(id);
    },
    [onSelect],
  );

  return (
    <View style={styles.grid}>
      {EMOTIONS.map((emotion) => (
        <EmotionCard
          key={emotion.id}
          emotion={emotion}
          isSelected={selectedEmotion === emotion.id}
          onPress={() => handleSelect(emotion.id)}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.alpha.whiteLight,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    gap: spacing.xs,
    elevation: 2,
  },
});
