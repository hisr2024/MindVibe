/**
 * JourneyTemplateCard — Begin a New Journey grid card.
 *
 * Mirrors the web mobile card 1:1: enemy-tinted hero strip with Devanagari
 * watermark + duration / difficulty / Free pills, italic title + description,
 * "TODAY THIS LOOKS LIKE" modern-context block with enemy left border, the
 * BG verse chip with sanskrit + transliteration, "Conquered by …" line,
 * and a themed CTA button at the bottom.
 *
 * If the user already has an active or paused journey for this template
 * (`startedInfo`), the CTA flips to "Continue → Day N" / "Resume Journey"
 * with a tinted-glass treatment instead of the gradient fill.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { Journey, JourneyTemplate } from '@kiaanverse/api';

import { ENEMY_INFO, type EnemyKey, enemyAlpha, getDifficultyLabel } from '../enemyInfo';

const DIFFICULTY_NUMERIC: Record<string, number> = {
  beginner: 1,
  intermediate: 3,
  advanced: 5,
};

export function JourneyTemplateCard({
  template,
  startedInfo,
  onStart,
  onContinue,
  isStarting,
  disabled,
}: {
  readonly template: JourneyTemplate;
  readonly startedInfo?: Journey | null | undefined;
  readonly onStart: (templateId: string) => void;
  readonly onContinue?: (journeyId: string) => void;
  readonly isStarting: boolean;
  readonly disabled?: boolean;
}): React.JSX.Element {
  const enemyKey =
    (template.primaryEnemyTags?.[0]?.toLowerCase() as EnemyKey | undefined) ??
    (template.category.toLowerCase() as EnemyKey);
  const info = enemyKey ? (ENEMY_INFO[enemyKey] ?? null) : null;
  const accent = info?.color ?? colors.divine.aura;

  const isActive = startedInfo?.status === 'active';
  const isPaused = startedInfo?.status === 'paused';
  const isStarted = isActive || isPaused;

  const verseRef = template.gitaVerseRef ?? info?.keyVerse ?? null;
  const verseSanskrit = template.gitaVerseText ?? null;
  const verseTranslit = info?.keyVerseText ?? null;
  const modernContext = template.modernContext ?? info?.modernContext ?? null;
  const transformation =
    template.transformationPromise ?? info?.conqueredBy ?? null;

  const difficultyNumeric = template.difficulty
    ? (DIFFICULTY_NUMERIC[template.difficulty] ?? 1)
    : 1;
  const difficultyLabel = getDifficultyLabel(difficultyNumeric);

  const handleCta = (): void => {
    if (disabled || isStarting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (isStarted && startedInfo && onContinue) {
      onContinue(startedInfo.id);
      return;
    }
    onStart(template.id);
  };

  const ctaLabel = isStarting
    ? 'Starting…'
    : isActive
      ? `Continue → Day ${startedInfo?.currentDay ?? 1}`
      : isPaused
        ? 'Resume Journey'
        : `Begin ${template.durationDays}-Day Journey →`;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: enemyAlpha(enemyKey, 0.22),
          borderTopColor: accent,
        },
      ]}
    >
      {/* HERO */}
      <View
        style={[
          styles.hero,
          { backgroundColor: enemyAlpha(enemyKey, 0.18) },
        ]}
      >
        <View style={styles.heroPills}>
          <Pill label={`${template.durationDays}d`} color={accent} />
          <Pill label={difficultyLabel} color={colors.text.muted} />
        </View>
        {isStarted ? (
          <View
            style={[
              styles.statePill,
              {
                backgroundColor: isActive
                  ? 'rgba(16,185,129,0.18)'
                  : 'rgba(217,119,6,0.18)',
                borderColor: isActive
                  ? 'rgba(16,185,129,0.4)'
                  : 'rgba(217,119,6,0.4)',
              },
            ]}
          >
            <Text variant="caption" color={isActive ? '#6EE7B7' : '#FCD34D'}>
              {isActive ? `DAY ${startedInfo?.currentDay ?? 1}` : 'PAUSED'}
            </Text>
          </View>
        ) : template.isFree !== false ? (
          <View
            style={[
              styles.statePill,
              {
                backgroundColor: 'rgba(16,185,129,0.15)',
                borderColor: 'rgba(16,185,129,0.35)',
              },
            ]}
          >
            <Text variant="caption" color="#6EE7B7">
              Free
            </Text>
          </View>
        ) : null}

        {info ? (
          <View style={styles.heroLabel}>
            <Text variant="h2" color={accent} style={styles.heroDevanagari}>
              {info.devanagari}
            </Text>
            <Text variant="caption" color={colors.text.secondary} style={styles.heroEnglish}>
              {info.name}
            </Text>
          </View>
        ) : null}
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <Text
          variant="h3"
          color={colors.text.primary}
          numberOfLines={2}
          style={styles.title}
        >
          {template.title}
        </Text>

        {template.description ? (
          <Text
            variant="bodySmall"
            color={colors.text.secondary}
            numberOfLines={2}
            style={styles.description}
          >
            {template.description}
          </Text>
        ) : null}

        {/* Real-life hook */}
        {modernContext ? (
          <View
            style={[
              styles.realLife,
              {
                backgroundColor: enemyAlpha(enemyKey, 0.07),
                borderColor: enemyAlpha(enemyKey, 0.2),
                borderLeftColor: accent,
              },
            ]}
          >
            <Text
              variant="caption"
              color={accent}
              style={styles.realLifeEyebrow}
            >
              TODAY THIS LOOKS LIKE
            </Text>
            <Text
              variant="caption"
              color={colors.text.secondary}
              numberOfLines={2}
              style={styles.realLifeBody}
            >
              {modernContext}
            </Text>
          </View>
        ) : null}

        {/* Gita verse */}
        {verseRef || verseSanskrit || verseTranslit ? (
          <View style={styles.verseBlock}>
            {verseRef ? (
              <Text variant="caption" color={colors.divine.aura} style={styles.verseEyebrow}>
                {`✦ BG ${verseRef.chapter}.${verseRef.verse}`}
              </Text>
            ) : null}
            {verseSanskrit ? (
              <Text
                variant="bodySmall"
                color="#F0C040"
                numberOfLines={1}
                style={styles.verseSanskrit}
              >
                {verseSanskrit.split('\n')[0]}
              </Text>
            ) : null}
            {verseTranslit ? (
              <Text
                variant="caption"
                color={colors.text.muted}
                numberOfLines={1}
                style={styles.verseTranslit}
              >
                {verseTranslit}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Conquered by */}
        {transformation ? (
          <View style={styles.transformRow}>
            <View
              style={[
                styles.transformDot,
                {
                  backgroundColor: enemyAlpha(enemyKey, 0.18),
                  borderColor: enemyAlpha(enemyKey, 0.35),
                },
              ]}
            >
              <Text variant="caption" color={accent}>
                →
              </Text>
            </View>
            <Text
              variant="caption"
              color={colors.text.secondary}
              numberOfLines={1}
              style={styles.transformText}
            >
              Conquered by{' '}
              <Text variant="caption" color={accent}>
                {transformation}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* CTA */}
        <Pressable
          onPress={handleCta}
          disabled={isStarting || disabled}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: isStarted
                ? enemyAlpha(enemyKey, 0.18)
                : accent,
              borderColor: isStarted
                ? enemyAlpha(enemyKey, 0.45)
                : accent,
              opacity: pressed || isStarting || disabled ? 0.7 : 1,
            },
          ]}
        >
          <Text
            variant="label"
            color={isStarted ? accent : '#050714'}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Pill({
  label,
  color,
}: {
  readonly label: string;
  readonly color: string;
}): React.JSX.Element {
  return (
    <View
      style={[styles.pill, { borderColor: `${color}55` }]}
      accessibilityElementsHidden
    >
      <Text variant="caption" color={color}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderTopWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(17,20,53,0.99)',
  },
  hero: {
    height: 96,
    padding: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  heroPills: {
    flexDirection: 'row',
    gap: 4,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(5,7,20,0.78)',
  },
  statePill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  heroLabel: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroDevanagari: {
    fontSize: 22,
  },
  heroEnglish: {
    fontStyle: 'italic',
  },
  body: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  description: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  realLife: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderLeftWidth: 2,
    borderRadius: 8,
  },
  realLifeEyebrow: {
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  realLifeBody: {
    fontStyle: 'italic',
    lineHeight: 16,
  },
  verseBlock: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 2,
    borderColor: 'rgba(212,160,23,0.18)',
    borderLeftColor: 'rgba(212,160,23,0.6)',
    backgroundColor: 'rgba(212,160,23,0.06)',
  },
  verseEyebrow: {
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  verseSanskrit: {
    lineHeight: 18,
  },
  verseTranslit: {
    fontStyle: 'italic',
  },
  transformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  transformDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transformText: {
    flex: 1,
    fontStyle: 'italic',
  },
  cta: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
