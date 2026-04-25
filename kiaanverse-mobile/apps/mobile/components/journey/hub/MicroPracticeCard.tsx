/**
 * MicroPracticeCard — The day's micro practice (1-2 sentence prompt).
 *
 * Pulled from the static 14-day JOURNEY_DAY_META so it works fully offline.
 * Visual: amber/orange left border, "MICRO PRACTICE" eyebrow, italic theme,
 * focus subtitle, then the prompt body. Mirrors the web mobile card.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';

import type { JourneyDayMeta } from './dayMeta';

const MICRO_AMBER = '#F97316';

export function MicroPracticeCard({
  dayMeta,
}: {
  readonly dayMeta: JourneyDayMeta;
}): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <Text variant="caption" color={MICRO_AMBER} style={styles.eyebrow}>
          MICRO PRACTICE
        </Text>
        <Text variant="h3" color={colors.text.primary} style={styles.theme}>
          {dayMeta.theme}
        </Text>
        <Text variant="caption" color={colors.text.muted}>
          {dayMeta.focus}
        </Text>
        <Text
          variant="body"
          color={colors.text.secondary}
          style={styles.prompt}
        >
          {dayMeta.microPractice}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.18)',
    backgroundColor: 'rgba(120,53,15,0.18)',
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: MICRO_AMBER,
  },
  body: {
    padding: spacing.lg,
    gap: 6,
  },
  eyebrow: {
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  theme: {
    fontStyle: 'italic',
    lineHeight: 26,
  },
  prompt: {
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
