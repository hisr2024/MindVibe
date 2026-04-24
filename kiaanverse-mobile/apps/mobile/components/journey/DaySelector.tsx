/**
 * DaySelector — Horizontal scrollable day navigation for 14-day journeys.
 *
 * Each day is a circular button. Completed days show a green checkmark,
 * the current day pulses with a golden border, and future/locked days
 * are dimmed. Auto-scrolls to the current day on mount. Haptic feedback
 * on selection.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DaySelectorProps {
  /** Total number of days in the journey. */
  readonly totalDays: number;
  /** The currently active/selected day (1-indexed). */
  readonly currentDay: number;
  /** Set of completed day indices (1-indexed). */
  readonly completedDays: Set<number>;
  /** Called when the user taps a day. */
  readonly onSelectDay: (day: number) => void;
  /** Enemy accent color for active day border. */
  readonly accentColor?: string;
  /** Optional container style. */
  readonly style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_BUTTON_SIZE = 48;
const DAY_BUTTON_GAP = 10;

// ---------------------------------------------------------------------------
// ActiveDayRing — pulsing golden border for the currently selected day.
// ---------------------------------------------------------------------------

function ActiveDayRing({
  color,
}: {
  readonly color: string;
}): React.JSX.Element {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.pulseRing,
        { borderColor: color },
        animStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// DayButton
// ---------------------------------------------------------------------------

function DayButton({
  day,
  isCurrent,
  isCompleted,
  isLocked,
  accentColor,
  onPress,
}: {
  readonly day: number;
  readonly isCurrent: boolean;
  readonly isCompleted: boolean;
  readonly isLocked: boolean;
  readonly accentColor: string;
  readonly onPress: () => void;
}): React.JSX.Element {
  const handlePress = useCallback(() => {
    if (isLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [isLocked, onPress]);

  const bgColor = isCompleted
    ? colors.semantic.success
    : isCurrent
      ? accentColor
      : colors.alpha.whiteLight;

  const textColor =
    isCompleted || isCurrent
      ? colors.raw.white
      : isLocked
        ? colors.text.muted
        : colors.text.secondary;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLocked}
      accessibilityRole="button"
      accessibilityLabel={`Day ${day}${isCompleted ? ', completed' : ''}${isCurrent ? ', current' : ''}${isLocked ? ', locked' : ''}`}
      accessibilityState={{ disabled: isLocked, selected: isCurrent }}
    >
      <View
        style={[
          styles.dayButton,
          { backgroundColor: bgColor, opacity: isLocked ? 0.4 : 1 },
        ]}
      >
        {isCurrent && <ActiveDayRing color={accentColor} />}

        {isCompleted ? (
          <Text variant="caption" color={colors.raw.white} align="center">
            {'\u2713'}
          </Text>
        ) : (
          <Text variant="label" color={textColor} align="center">
            {day}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// DaySelector
// ---------------------------------------------------------------------------

export function DaySelector({
  totalDays,
  currentDay,
  completedDays,
  onSelectDay,
  accentColor = colors.primary[500],
  style,
}: DaySelectorProps): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to current day on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const offset = Math.max(
        0,
        (currentDay - 3) * (DAY_BUTTON_SIZE + DAY_BUTTON_GAP)
      );
      scrollRef.current?.scrollTo({ x: offset, animated: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [currentDay]);

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <Animated.View entering={FadeIn.delay(200).duration(400)} style={style}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const isCompleted = completedDays.has(day);
          const isCurrent = day === currentDay;
          // Days after currentDay that are not completed are locked
          const isLocked = day > currentDay && !isCompleted;

          return (
            <DayButton
              key={day}
              day={day}
              isCurrent={isCurrent}
              isCompleted={isCompleted}
              isLocked={isLocked}
              accentColor={accentColor}
              onPress={() => onSelectDay(day)}
            />
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: DAY_BUTTON_GAP,
    alignItems: 'center',
  },
  dayButton: {
    width: DAY_BUTTON_SIZE,
    height: DAY_BUTTON_SIZE,
    borderRadius: DAY_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pulseRing: {
    borderRadius: DAY_BUTTON_SIZE / 2,
    borderWidth: 2,
  },
});
