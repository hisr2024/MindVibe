/**
 * TodaysStepCard — the detail screen's living practice card.
 *
 * Composition:
 *   1. Day label (ripu-colored badge + "Day N").
 *   2. Step prompt in CormorantGaramond-Italic 18 px — the sacred-quote
 *      typography so the user reads the prompt as a verse rather than a
 *      to-do item.
 *   3. (Optional) Gita quote in CrimsonText-Italic 15 px — the wisdom
 *      anchor for the day's practice.
 *   4. SacredInput for the reflection (multiline, 5 visible rows).
 *   5. DivineButton primary CTA "Submit Reflection" — disabled while the
 *      reflection is empty OR while the submit mutation is in flight.
 *
 * The card is a SacredCard variant (gold top shimmer + indigo glass) so
 * it reads as an elevated sanctuary within the already-layered hero.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DivineButton, SacredCard, SacredInput } from '@kiaanverse/ui';

import { NEUTRAL_ACCENT, ripuAlpha, type Ripu } from './ripus';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';
const DIVINE_GOLD = '#D4A017';

export interface TodaysStepCardProps {
  /** Day index (1-based). */
  readonly dayIndex: number;
  /** Step prompt / title — rendered in CormorantGaramond-Italic. */
  readonly prompt: string;
  /** Optional Gita verse or wisdom quote for the day. */
  readonly quote?: string | undefined;
  /** Optional verse citation (e.g. "BG 2.47"). */
  readonly verseRef?: string | undefined;
  /** Ripu metadata — drives the day-label tint. */
  readonly ripu: Ripu | null;
  /** Reflection draft. */
  readonly reflection: string;
  /** Reflection change handler. */
  readonly onChangeReflection: (text: string) => void;
  /** Submit handler — called with the trimmed reflection text. */
  readonly onSubmit: (reflection: string) => void;
  /** True while the submit mutation is in flight. */
  readonly isSubmitting: boolean;
  /** True when the step was already completed — disables the CTA. */
  readonly isCompleted: boolean;
}

function TodaysStepCardInner({
  dayIndex,
  prompt,
  quote,
  verseRef,
  ripu,
  reflection,
  onChangeReflection,
  onSubmit,
  isSubmitting,
  isCompleted,
}: TodaysStepCardProps): React.JSX.Element {
  const accent = ripu?.color ?? NEUTRAL_ACCENT;
  const canSubmit =
    !isCompleted && !isSubmitting && reflection.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit(reflection.trim());
  }, [canSubmit, onSubmit, reflection]);

  return (
    <SacredCard style={styles.card}>
      {/* Day badge */}
      <View style={styles.dayRow}>
        <View
          style={[
            styles.dayBadge,
            {
              backgroundColor: ripuAlpha(accent, 0.14),
              borderColor: ripuAlpha(accent, 0.5),
            },
          ]}
        >
          <Text style={[styles.dayBadgeText, { color: accent }]}>
            Day {dayIndex}
          </Text>
        </View>
        {isCompleted ? (
          <Text style={styles.completedTag}>Already reflected</Text>
        ) : (
          <Text style={styles.todayTag}>Today’s practice</Text>
        )}
      </View>

      {/* Sacred prompt */}
      <Text style={styles.prompt} accessibilityRole="text">
        {prompt}
      </Text>

      {/* Gita wisdom quote */}
      {quote ? (
        <View style={styles.quoteWrap}>
          <View
            style={[styles.quoteBar, { backgroundColor: accent }]}
            pointerEvents="none"
          />
          <View style={styles.quoteBody}>
            <Text style={styles.quote}>“{quote}”</Text>
            {verseRef ? (
              <Text style={styles.verseRef}>— {verseRef}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Reflection input */}
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Your reflection</Text>
        <SacredInput
          value={reflection}
          onChangeText={onChangeReflection}
          placeholder="Where did this battle appear today? What did you notice?"
          multiline
          numberOfLines={5}
          editable={!isCompleted && !isSubmitting}
          accessibilityLabel="Reflection text input"
          textAlignVertical="top"
          containerStyle={styles.input}
        />
      </View>

      {/* CTA */}
      <DivineButton
        title={
          isCompleted
            ? 'Reflection saved'
            : isSubmitting
              ? 'Submitting…'
              : 'Submit Reflection'
        }
        variant="primary"
        onPress={handleSubmit}
        disabled={!canSubmit}
        loading={isSubmitting}
        accessibilityLabel="Submit today's reflection"
      />
    </SacredCard>
  );
}

/** Today's Gita-anchored practice card with reflection + submit. */
export const TodaysStepCard = React.memo(TodaysStepCardInner);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: 14,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  dayBadgeText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  todayTag: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: DIVINE_GOLD,
    letterSpacing: 0.6,
  },
  completedTag: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  prompt: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 18,
    color: SACRED_WHITE,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  quoteWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  quoteBar: {
    width: 2,
    borderRadius: 1,
    alignSelf: 'stretch',
  },
  quoteBody: {
    flex: 1,
    gap: 4,
  },
  quote: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: SACRED_WHITE,
    lineHeight: 22,
  },
  verseRef: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: DIVINE_GOLD,
    letterSpacing: 0.6,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.4,
  },
  input: {
    minHeight: 110,
  },
});
