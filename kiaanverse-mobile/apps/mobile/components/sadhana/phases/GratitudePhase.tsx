/**
 * GratitudePhase — Phase 6 of Nitya Sadhana: closing mood + gratitude.
 *
 * Composition:
 *   - Mood row: six emoji pills (Heavy → Blissful). Selecting one
 *     updates state + fires a Selection haptic. Selection persists
 *     through this phase only — the sadhana screen forwards it to the
 *     completion payload so the backend sees a mood_score.
 *   - SacredInput: "What are you grateful for today?"
 *   - DivineButton "Complete Sadhana" — the final ceremonial CTA.
 *     Enabled as soon as a mood is selected so gratitude is encouraged
 *     but not enforced (some mornings, simply choosing a mood is
 *     itself the offering).
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DivineButton, SacredInput } from '@kiaanverse/ui';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

export interface MoodOption {
  readonly emoji: string;
  readonly label: string;
  readonly score: number;
}

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { emoji: '😔', label: 'Heavy', score: 1 },
  { emoji: '😕', label: 'Unsettled', score: 2 },
  { emoji: '😐', label: 'Neutral', score: 3 },
  { emoji: '🙂', label: 'Peaceful', score: 4 },
  { emoji: '😊', label: 'Blissful', score: 5 },
];

export interface GratitudePhaseProps {
  readonly mood: number | null;
  readonly onChangeMood: (score: number) => void;
  readonly gratitude: string;
  readonly onChangeGratitude: (text: string) => void;
  /** Called with the final (mood, gratitude) tuple. */
  readonly onComplete: () => void;
  /** True while the completion mutation is in flight. */
  readonly isCompleting: boolean;
}

function GratitudePhaseInner({
  mood,
  onChangeMood,
  gratitude,
  onChangeGratitude,
  onComplete,
  isCompleting,
}: GratitudePhaseProps): React.JSX.Element {
  const handleMood = useCallback(
    (score: number) => {
      if (score === mood) return;
      void Haptics.selectionAsync();
      onChangeMood(score);
    },
    [mood, onChangeMood],
  );

  const canFinish = mood !== null;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE VI
        </Text>
        <Text style={styles.phaseName}>Gratitude</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          कृतज्ञता · Kritajñata
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          HOW DO YOU FEEL?
        </Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((opt) => {
            const active = mood === opt.score;
            return (
              <Pressable
                key={opt.score}
                onPress={() => handleMood(opt.score)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${opt.label} mood`}
                style={[styles.moodChip, active && styles.moodChipActive]}
              >
                <Text style={styles.moodEmoji} allowFontScaling={false}>
                  {opt.emoji}
                </Text>
                <Text
                  style={[
                    styles.moodLabel,
                    active && styles.moodLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel} allowFontScaling={false}>
          WHAT ARE YOU GRATEFUL FOR TODAY?
        </Text>
        <SacredInput
          value={gratitude}
          onChangeText={onChangeGratitude}
          placeholder="One thing, small or sacred."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Gratitude statement"
          containerStyle={styles.input}
        />
      </View>

      <View style={styles.cta}>
        <DivineButton
          title={isCompleting ? 'Completing…' : 'Complete Sadhana'}
          variant="primary"
          onPress={onComplete}
          disabled={!canFinish || isCompleting}
          loading={isCompleting}
        />
      </View>
    </View>
  );
}

/** Phase 6 — final mood + gratitude offering. */
export const GratitudePhase = React.memo(GratitudePhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 18,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  phaseLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 2,
  },
  phaseName: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 28,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 14,
    lineHeight: 28,
    color: GOLD,
    textAlign: 'center',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.6,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    backgroundColor: 'rgba(17,20,53,0.6)',
    gap: 4,
  },
  moodChipActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(212,160,23,0.18)',
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
  },
  moodLabelActive: {
    fontFamily: 'Outfit-SemiBold',
    color: SACRED_WHITE,
  },
  input: {
    minHeight: 110,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: 'auto',
  },
});
