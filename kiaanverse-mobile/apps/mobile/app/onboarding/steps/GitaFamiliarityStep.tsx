/**
 * Step 3: Gita Familiarity — Slider from "Never read" to "Scholar"
 *
 * Custom slider built with Reanimated + Gesture Handler.
 * 5 levels: 0 = Never read, 1 = Curious, 2 = Beginner, 3 = Practitioner, 4 = Scholar
 * Skip option available.
 */

import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text, GoldenButton, colors, spacing } from '@kiaanverse/ui';

const LEVELS = [
  { value: 0, label: 'Never read' },
  { value: 1, label: 'Curious' },
  { value: 2, label: 'Beginner' },
  { value: 3, label: 'Practitioner' },
  { value: 4, label: 'Scholar' },
] as const;

interface GitaFamiliarityStepProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function GitaFamiliarityStep({
  value,
  onChange,
  onNext,
  onSkip,
}: GitaFamiliarityStepProps): React.JSX.Element {
  const { width: screenWidth } = useWindowDimensions();
  const trackWidth = screenWidth - spacing.xl * 2 - spacing.md * 2;
  const segmentWidth = trackWidth / (LEVELS.length - 1);

  const thumbX = useSharedValue(value * segmentWidth);

  // Sync thumb position when value or screen dimensions change
  // (e.g. navigating back to this step, or screen rotation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    thumbX.value = withSpring(value * segmentWidth, { damping: 20, stiffness: 200 });
  }, [value, segmentWidth, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value + 12,
  }));

  const handleSelect = useCallback(
    (level: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // eslint-disable-next-line react-hooks/immutability
      thumbX.value = withSpring(level * segmentWidth, { damping: 20, stiffness: 200 });
      onChange(level);
    },
    [onChange, segmentWidth, thumbX],
  );

  const currentLabel = LEVELS.find((l) => l.value === value)?.label ?? 'Never read';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" align="center">
          Know the Gita?
        </Text>
        <Text variant="bodySmall" color={colors.text.muted} align="center">
          This helps Sakha tailor wisdom to your level
        </Text>
      </View>

      {/* Current level label */}
      <Text variant="h2" color={colors.primary[300]} align="center">
        {currentLabel}
      </Text>

      {/* Slider track */}
      <View style={styles.sliderWrap}>
        <View style={[styles.track, { width: trackWidth }]}>
          {/* Filled portion */}
          <Animated.View style={[styles.trackFill, fillStyle]} />

          {/* Thumb */}
          <Animated.View style={[styles.thumb, thumbStyle]} />

          {/* Tick marks — pressable for accessibility */}
          {LEVELS.map((level) => (
            <Pressable
              key={level.value}
              onPress={() => handleSelect(level.value)}
              style={[
                styles.tickTarget,
                { left: level.value * segmentWidth - 20 },
              ]}
              accessibilityRole="adjustable"
              accessibilityLabel={level.label}
              accessibilityValue={{ text: level.label }}
            >
              <View
                style={[
                  styles.tick,
                  level.value <= value && styles.tickActive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        {/* Labels below track */}
        <View style={[styles.labelRow, { width: trackWidth }]}>
          <Text variant="caption" color={colors.text.muted}>
            Never read
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            Scholar
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <GoldenButton
          title="Continue"
          onPress={onNext}
          testID="gita-next"
        />
        <GoldenButton
          title="Skip"
          variant="ghost"
          onPress={onSkip}
          testID="gita-skip"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
  },
  sliderWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  track: {
    height: 4,
    backgroundColor: colors.alpha.whiteLight,
    borderRadius: 2,
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500],
    borderWidth: 3,
    borderColor: colors.background.dark,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  tickTarget: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  tick: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alpha.whiteLight,
  },
  tickActive: {
    backgroundColor: colors.primary[500],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    gap: spacing.sm,
  },
});
