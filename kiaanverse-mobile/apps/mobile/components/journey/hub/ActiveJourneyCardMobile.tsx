/**
 * ActiveJourneyCardMobile — Continue Your Journey card.
 *
 * Used both in the Today sub-tab's horizontal pager and inside the Journeys
 * (Browse) sub-tab's "YOUR ACTIVE BATTLES" section. Mirrors the web mobile
 * card 1:1: enemy-tinted gradient background, Devanagari + English label,
 * "Active" pill, title, linear progress bar, "Day N of M" + percentage,
 * and a circular progress arc on the right.
 *
 * Optionally renders Pause/Close action buttons below the card when used
 * on the Journeys sub-tab.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, colors, spacing, radii } from '@kiaanverse/ui';
import type { Journey } from '@kiaanverse/api';

import { ENEMY_INFO, type EnemyKey, enemyAlpha } from '../enemyInfo';
import { DayProgressRing } from '../DayProgressRing';

export function ActiveJourneyCardMobile({
  journey,
  showActions = false,
  onPause,
  onClose,
  isPausing = false,
  isClosing = false,
}: {
  readonly journey: Journey;
  readonly showActions?: boolean;
  readonly onPause?: ((journeyId: string) => void) | undefined;
  readonly onClose?: ((journeyId: string) => void) | undefined;
  readonly isPausing?: boolean;
  readonly isClosing?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const enemyKey =
    (journey.primaryEnemies?.[0]?.toLowerCase() as EnemyKey | undefined) ??
    (journey.category.toLowerCase() as EnemyKey);
  const info = enemyKey ? (ENEMY_INFO[enemyKey] ?? null) : null;
  const accent = info?.color ?? colors.divine.aura;

  const progressPct =
    journey.progressPercentage ??
    Math.round((journey.completedSteps / Math.max(1, journey.durationDays)) * 100);

  const open = (): void => {
    Haptics.selectionAsync().catch(() => undefined);
    router.push({
      pathname: '/journey/[id]',
      params: { id: journey.id },
    });
  };

  const isPaused = journey.status === 'paused';

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${journey.title}, day ${journey.currentDay} of ${journey.durationDays}`}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: enemyAlpha(enemyKey, 0.22),
            backgroundColor: enemyAlpha(enemyKey, 0.12),
            opacity: pressed ? 0.94 : 1,
          },
        ]}
      >
        <View style={styles.top}>
          <View style={styles.topText}>
            {info ? (
              <View style={styles.labelRow}>
                <Text variant="bodySmall" color={accent} style={styles.devanagari}>
                  {info.devanagari}
                </Text>
                <Text variant="caption" color={accent}>
                  {info.name}
                </Text>
              </View>
            ) : null}
            <Text variant="h3" color={colors.text.primary} numberOfLines={2}>
              {journey.title}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text variant="caption" color={colors.text.secondary}>
              {isPaused ? 'Paused' : 'Active'}
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.progressArea}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPct}%`, backgroundColor: accent },
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Text variant="caption" color={colors.text.muted}>
                {`Day ${journey.currentDay} of ${journey.durationDays}`}
              </Text>
              <Text variant="caption" color={accent}>
                {`${progressPct}%`}
              </Text>
            </View>
            {(journey.streakDays ?? 0) > 0 ? (
              <View style={styles.streakRow}>
                <Text variant="caption" color="#F97316">
                  {`🔥 ${journey.streakDays} day streak`}
                </Text>
              </View>
            ) : null}
          </View>

          <DayProgressRing
            completed={journey.completedSteps}
            total={journey.durationDays}
            color={accent}
            size={56}
          />
        </View>
      </Pressable>

      {showActions ? (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              if (!onPause || isPausing) return;
              Haptics.selectionAsync().catch(() => undefined);
              onPause(journey.id);
            }}
            disabled={isPausing || isPaused}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Already paused' : 'Pause journey'}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.pauseBtn,
              { opacity: pressed || isPaused || isPausing ? 0.6 : 1 },
            ]}
          >
            <Text variant="label" color={colors.text.primary}>
              {isPaused ? 'Paused' : isPausing ? 'Pausing…' : 'Pause'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!onClose || isClosing) return;
              Haptics.selectionAsync().catch(() => undefined);
              onClose(journey.id);
            }}
            disabled={isClosing}
            accessibilityRole="button"
            accessibilityLabel="Close journey"
            style={({ pressed }) => [
              styles.actionBtn,
              styles.closeBtn,
              {
                borderColor: 'rgba(220,38,38,0.45)',
                opacity: pressed || isClosing ? 0.6 : 1,
              },
            ]}
          >
            <Text variant="label" color="#F87171">
              {isClosing ? 'Closing…' : 'Close'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.lg,
    minHeight: 170,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  topText: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  devanagari: {
    fontSize: 15,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.alpha.whiteLight,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  progressArea: {
    flex: 1,
    gap: 6,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.alpha.whiteLight,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakRow: {
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtn: {
    backgroundColor: colors.alpha.whiteLight,
    borderColor: colors.alpha.whiteLight,
  },
  closeBtn: {
    backgroundColor: 'rgba(220,38,38,0.05)',
  },
});
