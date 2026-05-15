/**
 * Step 2: Purpose — Multi-select spiritual goals
 *
 * User selects one or more purposes: Peace, Wisdom, Guidance, Healing, Purpose.
 * Pressable chips with gold border on selection. Skip option available.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, GoldenButton, colors, spacing, radii } from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';

const PURPOSES = [
  { id: 'peace', labelKey: 'onboarding.purposePeace', icon: '🕊️' },
  { id: 'wisdom', labelKey: 'onboarding.purposeWisdom', icon: '📖' },
  { id: 'guidance', labelKey: 'onboarding.purposeGuidance', icon: '🧭' },
  { id: 'healing', labelKey: 'onboarding.purposeHealing', icon: '💛' },
  { id: 'purpose', labelKey: 'onboarding.purposePurpose', icon: '⭐' },
] as const;

interface PurposeStepProps {
  readonly selected: string[];
  readonly onToggle: (id: string) => void;
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function PurposeStep({
  selected,
  onToggle,
  onNext,
  onSkip,
}: PurposeStepProps): React.JSX.Element {
  const { t } = useTranslation();
  const handleToggle = useCallback(
    (id: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(id);
    },
    [onToggle]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" align="center">
          {t('onboarding.purposeTitle')}
        </Text>
        <Text variant="bodySmall" color={colors.text.muted} align="center">
          {t('onboarding.purposeSubtitle')}
        </Text>
      </View>

      <View style={styles.grid}>
        {PURPOSES.map((item) => {
          const isSelected = selected.includes(item.id);
          const label = t(item.labelKey);
          return (
            <Pressable
              key={item.id}
              onPress={() => handleToggle(item.id)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={label}
            >
              <Text variant="h3" align="center">
                {item.icon}
              </Text>
              <Text
                variant="label"
                align="center"
                color={isSelected ? colors.primary[300] : colors.text.secondary}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <GoldenButton
          title={t('onboarding.continueButton')}
          onPress={onNext}
          disabled={selected.length === 0}
          testID="purpose-next"
        />
        <GoldenButton
          title={t('common.skip')}
          variant="ghost"
          onPress={onSkip}
          testID="purpose-skip"
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  chip: {
    width: '45%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.alpha.goldLight,
  },
  actions: {
    gap: spacing.sm,
  },
});
