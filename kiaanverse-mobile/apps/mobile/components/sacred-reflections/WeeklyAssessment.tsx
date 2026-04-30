/**
 * Sacred Reflections — Weekly Assessment block.
 *
 * Five plaintext questions that power KarmaLytix without needing to decrypt
 * the journal body. Appears at most once per ISO week — once saved, the
 * block hides itself until the next week rolls over.
 *
 *   Q1. Greatest dharmic challenge this week? (chip: Anger/Fear/…)
 *   Q2. Which Gita teaching felt most alive? (free text, 200 chars)
 *   Q3. Practice consistency (1–5)
 *   Q4. Pattern you're noticing in yourself (free text, 280 chars)
 *   Q5. Sankalpa for next week (free text, 200 chars)
 *
 * Answers persist to AsyncStorage via `saveAssessmentAnswers(weekKey, …)`
 * — plaintext, keyed by ISO-week, never encrypted (that's by design; the
 * Sacred Mirror needs them plaintext). We surface the "not encrypted"
 * notice inline so the user knows the trade-off before typing.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GoldenButton, Text, colors, spacing } from '@kiaanverse/ui';

import {
  getIsoWeekKey,
  loadAssessmentStore,
  saveAssessmentAnswers,
} from '../../utils/sacredReflectionEncryption';

const CHALLENGE_OPTIONS = [
  'Anger',
  'Fear',
  'Attachment',
  'Pride',
  'Greed',
  'Confusion',
] as const;

export function WeeklyAssessment(): React.JSX.Element | null {
  const [isDue, setIsDue] = useState<boolean | null>(null);
  const [weekKey, setWeekKey] = useState<string>(() =>
    getIsoWeekKey(new Date())
  );
  const [challenge, setChallenge] = useState('');
  const [gitaTeaching, setGitaTeaching] = useState('');
  const [consistency, setConsistency] = useState(0);
  const [pattern, setPattern] = useState('');
  const [sankalpa, setSankalpa] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = await loadAssessmentStore();
      const key = getIsoWeekKey(new Date());
      if (!cancelled) {
        setWeekKey(key);
        setIsDue(!store[key]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      await saveAssessmentAnswers(weekKey, {
        dharmic_challenge: challenge,
        gita_teaching: gitaTeaching,
        consistency_score: consistency,
        pattern_noticed: pattern,
        sankalpa_for_next_week: sankalpa,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsDue(false);
    } finally {
      setIsSaving(false);
    }
  }, [
    weekKey,
    challenge,
    gitaTeaching,
    consistency,
    pattern,
    sankalpa,
    isSaving,
  ]);

  if (isDue !== true) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3" color={colors.primary[500]} style={styles.title}>
          🌀 Weekly Sacred Assessment
        </Text>
        <Text variant="caption" color={colors.text.muted} style={styles.sub}>
          Plaintext — powers KarmaLytix. Choose your words with care.
        </Text>
      </View>

      {/* Q1 */}
      <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
        What was your greatest dharmic challenge this week?
      </Text>
      <View style={styles.chipRow}>
        {CHALLENGE_OPTIONS.map((opt) => {
          const selected = challenge === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => {
                void Haptics.selectionAsync();
                setChallenge((prev) => (prev === opt ? '' : opt));
              }}
              style={[styles.chip, selected && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                variant="caption"
                color={
                  selected ? colors.background.dark : colors.text.secondary
                }
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Q2 */}
      <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
        Which Gita teaching felt most alive this week?
      </Text>
      <ShankhaVoiceInput
        value={gitaTeaching}
        onChangeText={setGitaTeaching}
        placeholder="e.g. Nishkama Karma, surrender, impermanence…"
        style={styles.input}
        maxLength={200}
        dictationMode="append"
        />

      {/* Q3 */}
      <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
        How consistent was your practice? (1–5)
      </Text>
      <View style={styles.consistencyRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = consistency >= n;
          return (
            <Pressable
              key={n}
              onPress={() => {
                void Haptics.selectionAsync();
                setConsistency(n);
              }}
              style={[styles.dot, filled && styles.dotFilled]}
              accessibilityRole="button"
              accessibilityLabel={`Practice consistency ${n} of 5`}
              accessibilityState={{ selected: consistency === n }}
            >
              <Text
                variant="label"
                color={filled ? colors.background.dark : colors.text.muted}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Q4 */}
      <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
        What pattern are you noticing in yourself?
      </Text>
      <ShankhaVoiceInput
        value={pattern}
        onChangeText={setPattern}
        placeholder="e.g. I react to criticism with anger…"
        style={styles.input}
        maxLength={280}
        multiline
        dictationMode="append"
        />

      {/* Q5 */}
      <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
        What sankalpa do you carry into next week?
      </Text>
      <ShankhaVoiceInput
        value={sankalpa}
        onChangeText={setSankalpa}
        placeholder="e.g. I will respond instead of react…"
        style={styles.input}
        maxLength={200}
        dictationMode="append"
        />

      <GoldenButton
        title={isSaving ? 'Saving…' : 'Save this week’s assessment'}
        onPress={handleSave}
        disabled={isSaving}
        style={styles.saveButton}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: spacing.sm,
  },
  header: { gap: 4 },
  title: { fontStyle: 'italic' },
  sub: { fontStyle: 'italic', lineHeight: 18 },
  qLabel: { marginTop: spacing.md, letterSpacing: 1 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackMedium,
    color: colors.text.primary,
    fontSize: 15,
    minHeight: 44,
  },
  consistencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dot: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  saveButton: { marginTop: spacing.md },
});
