/**
 * ReflectionPhase — Phase 4 of Nitya Sadhana: journal entry.
 *
 * A guided prompt seeds the user's reflection. The SacredInput accepts
 * multi-line text; the "Complete Phase" button enables once the draft
 * has at least one non-whitespace character — we do not require a
 * minimum word count, because a single honest word is more sacred than
 * a paragraph of performance.
 *
 * Entries are passed up via the `onChange` prop; the orchestrator
 * handles persistence (via the existing Sadhana journal API when the
 * backend route ships; until then it is kept in screen state only).
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { DivineButton, SacredInput } from '@kiaanverse/ui';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

export interface ReflectionPhaseProps {
  readonly prompt?: string | undefined;
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly onComplete: () => void;
}

const DEFAULT_PROMPT =
  'Where did today’s verse meet your life? What did it ask of you?';

function ReflectionPhaseInner({
  prompt,
  value,
  onChange,
  onComplete,
}: ReflectionPhaseProps): React.JSX.Element {
  const canComplete = value.trim().length > 0;

  const handleComplete = useCallback(() => {
    if (!canComplete) return;
    onComplete();
  }, [canComplete, onComplete]);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE IV
        </Text>
        <Text style={styles.phaseName}>Reflection</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          मनन · Manana
        </Text>
      </View>

      <View style={styles.promptCard}>
        <Text style={styles.promptLabel} allowFontScaling={false}>
          TODAY’S PROMPT
        </Text>
        <Text style={styles.prompt}>{prompt ?? DEFAULT_PROMPT}</Text>
      </View>

      <View style={styles.inputWrap}>
        <SacredInput
          value={value}
          onChangeText={onChange}
          placeholder="Write from the quiet after the verse…"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          accessibilityLabel="Reflection journal entry"
          containerStyle={styles.input}
        />
        <Text style={styles.encryptedHint}>
          ✦ Your reflection is encrypted on this device.
        </Text>
      </View>

      <View style={styles.cta}>
        <DivineButton
          title="Complete Phase"
          variant="primary"
          onPress={handleComplete}
          disabled={!canComplete}
        />
      </View>
    </ScrollView>
  );
}

/** Phase 4 — guided journal reflection on today's verse. */
export const ReflectionPhase = React.memo(ReflectionPhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
    // Extra bottom breathing room so the "Complete Phase" button floats
    // above the keyboard once it opens, rather than flush against it.
    paddingBottom: 32,
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
  promptCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    backgroundColor: 'rgba(212,160,23,0.06)',
    gap: 6,
  },
  promptLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    letterSpacing: 1.6,
    color: GOLD,
  },
  prompt: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 16,
    color: SACRED_WHITE,
    lineHeight: 24,
  },
  inputWrap: {
    gap: 6,
  },
  input: {
    minHeight: 180,
  },
  encryptedHint: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
