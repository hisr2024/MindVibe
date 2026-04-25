/**
 * TodayPracticeCard — Single "Today's Practice" entry card.
 *
 * Mirrors web mobile 1:1: Devanagari enemy badge in the enemy colour,
 * Day N: Title, italic teaching preview, and either a "Practice →" CTA
 * pill (active step) or a green checkmark with "Done" caption (completed).
 *
 * Tapping the card opens the matching step player day.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { DashboardTodayStep } from '@kiaanverse/api';

import { ENEMY_INFO, type EnemyKey, enemyAlpha } from '../enemyInfo';

export function TodayPracticeCard({
  step,
}: {
  readonly step: DashboardTodayStep;
}): React.JSX.Element {
  const router = useRouter();
  const enemyKey = (step.primaryEnemy?.toLowerCase() as EnemyKey) ?? null;
  const info = enemyKey ? (ENEMY_INFO[enemyKey] ?? null) : null;
  const accent = info?.color ?? colors.divine.aura;

  const open = (): void => {
    if (step.isCompleted) return;
    Haptics.selectionAsync().catch(() => undefined);
    router.push({
      pathname: '/journey/step/[day]',
      params: { day: String(step.dayIndex), journeyId: step.journeyId },
    });
  };

  const teachingPreview =
    step.teaching.length > 120
      ? `${step.teaching.slice(0, 120).trim()}…`
      : step.teaching || 'Daily practice awaits';

  return (
    <Pressable
      onPress={open}
      disabled={step.isCompleted}
      accessibilityRole="button"
      accessibilityLabel={`Day ${step.dayIndex}: ${step.stepTitle}`}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: enemyAlpha(enemyKey, 0.22),
          borderTopColor: accent,
          backgroundColor: enemyAlpha(enemyKey, 0.06),
          opacity: pressed && !step.isCompleted ? 0.92 : 1,
        },
      ]}
    >
      {/* Left accent strip — mirrors the web design. */}
      <View style={[styles.accentStrip, { backgroundColor: accent }]} />

      <View style={styles.body}>
        {info ? (
          <Text variant="caption" color={accent} style={styles.devanagari}>
            {info.devanagari}
          </Text>
        ) : null}

        <View style={styles.row}>
          <View style={styles.text}>
            <Text variant="h3" color={colors.text.primary} numberOfLines={1}>
              {step.stepTitle}
            </Text>
            <Text
              variant="bodySmall"
              color={colors.text.secondary}
              numberOfLines={2}
              style={styles.teaching}
            >
              {teachingPreview}
            </Text>
            <Text variant="caption" color={accent} style={styles.dayLabel}>
              {`Day ${step.dayIndex}`}
            </Text>
          </View>

          <View style={styles.cta}>
            {step.isCompleted ? (
              <View style={styles.doneWrap}>
                <Text variant="h3" color={colors.semantic.success}>
                  ✓
                </Text>
                <Text
                  variant="caption"
                  color={colors.semantic.success}
                  style={styles.doneLabel}
                >
                  Done
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.practicePill,
                  { backgroundColor: accent },
                ]}
              >
                <Text variant="label" color="#050714">
                  {'Practice →'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderTopWidth: 2,
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  body: {
    padding: spacing.md,
    paddingLeft: spacing.lg,
    gap: spacing.xs,
  },
  devanagari: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  teaching: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  dayLabel: {
    marginTop: 2,
  },
  cta: {
    alignSelf: 'center',
  },
  practicePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  doneWrap: {
    alignItems: 'center',
  },
  doneLabel: {
    marginTop: 2,
  },
});
