/**
 * Step 4: Daily Practice — Time picker for daily reminder
 *
 * Simple hour/period selector for setting a daily spiritual practice reminder.
 * Skip option available.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, GoldenButton, colors, spacing, radii } from '@kiaanverse/ui';

const HOURS = [6, 7, 8, 9, 10, 11, 12] as const;
const PERIODS = ['AM', 'PM'] as const;

interface DailyPracticeStepProps {
  readonly value: string;
  readonly onChange: (time: string) => void;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function DailyPracticeStep({
  value,
  onChange,
  onNext,
  onSkip,
}: DailyPracticeStepProps): React.JSX.Element {
  // Parse initial value (HH:mm 24h format) into hour/period
  const parsedHour = value ? parseInt(value.split(':')[0] ?? '8', 10) : 8;
  const initialDisplayHour =
    parsedHour > 12 ? parsedHour - 12 : parsedHour === 0 ? 12 : parsedHour;
  const initialPeriod = parsedHour >= 12 ? 'PM' : 'AM';

  const [selectedHour, setSelectedHour] = useState(initialDisplayHour);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(
    initialPeriod as 'AM' | 'PM'
  );

  const updateTime = useCallback(
    (hour: number, period: 'AM' | 'PM') => {
      let h24 = hour;
      if (period === 'PM' && hour !== 12) h24 = hour + 12;
      if (period === 'AM' && hour === 12) h24 = 0;
      const timeStr = `${String(h24).padStart(2, '0')}:00`;
      onChange(timeStr);
    },
    [onChange]
  );

  const handleHourSelect = useCallback(
    (hour: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedHour(hour);
      updateTime(hour, selectedPeriod);
    },
    [selectedPeriod, updateTime]
  );

  const handlePeriodToggle = useCallback(
    (period: 'AM' | 'PM') => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedPeriod(period);
      updateTime(selectedHour, period);
    },
    [selectedHour, updateTime]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" align="center">
          Daily Practice Time
        </Text>
        <Text variant="bodySmall" color={colors.text.muted} align="center">
          When would you like your daily spiritual reminder?
        </Text>
      </View>

      {/* Time display */}
      <Text variant="display" color={colors.primary[300]} align="center">
        {selectedHour}:00 {selectedPeriod}
      </Text>

      {/* Hour grid */}
      <View style={styles.hourGrid}>
        {HOURS.map((hour) => {
          const isSelected = selectedHour === hour;
          return (
            <Pressable
              key={hour}
              onPress={() => handleHourSelect(hour)}
              style={[styles.hourChip, isSelected && styles.hourChipSelected]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${hour} o'clock`}
            >
              <Text
                variant="label"
                color={isSelected ? colors.primary[300] : colors.text.secondary}
                align="center"
              >
                {hour}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* AM/PM toggle */}
      <View style={styles.periodRow}>
        {PERIODS.map((period) => {
          const isSelected = selectedPeriod === period;
          return (
            <Pressable
              key={period}
              onPress={() => handlePeriodToggle(period)}
              style={[
                styles.periodChip,
                isSelected && styles.periodChipSelected,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                variant="label"
                color={isSelected ? colors.primary[300] : colors.text.secondary}
                align="center"
              >
                {period}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <GoldenButton
          title="Continue"
          onPress={onNext}
          testID="practice-next"
        />
        <GoldenButton
          title="Skip"
          variant="ghost"
          onPress={onSkip}
          testID="practice-skip"
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
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  hourChip: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourChipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.alpha.goldLight,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  periodChip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  periodChipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.alpha.goldLight,
  },
  actions: {
    gap: spacing.sm,
  },
});
