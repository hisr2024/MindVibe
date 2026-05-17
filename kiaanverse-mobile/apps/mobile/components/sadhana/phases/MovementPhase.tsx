/**
 * MovementPhase — Phase V of Nitya Sadhana: bring today's verse into life.
 *
 * Renamed from the original Surya Namaskar / Asana phase. The verse-driven
 * "Application / Vyavahara" interpretation asks Sakha to generate a
 * concrete modern-day scenario for the day's verse — a working
 * professional, parent or student living the teaching without naming it
 * — so the verse moves from contemplation (Wisdom phase) to lived action.
 *
 * The example is fetched once per verse per day via `useVerseModernExample`
 * and cached for 24 hours, so the content is fresh every morning but does
 * not re-call the LLM on every screen mount.
 *
 * The component name and exported symbol stay `MovementPhase` so the
 * parent (`sadhana/index.tsx`) does not need to thread a new phase key
 * through the PHASE_ORDER / completion machinery — the rename is purely
 * a UI label change.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DivineButton, SacredCard } from '@kiaanverse/ui';
import { useVerseModernExample } from '@kiaanverse/api';

const SACRED_WHITE = '#F5F0E8';
const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(240,235,225,0.6)';

export interface MovementPhaseVerse {
  readonly chapter: number;
  readonly verse: number;
  readonly sanskrit: string;
  readonly transliteration?: string;
  readonly translation: string;
  /** Display label like "Bhagavad Gita 2.47" — shown above the example. */
  readonly reference: string;
}

export interface MovementPhaseProps {
  /** Today's verse — when omitted the phase shows a graceful placeholder
   *  and lets the user complete the phase anyway. */
  readonly verse?: MovementPhaseVerse | undefined;
  readonly onComplete: () => void;
}

/** Friendly grounding when the AI call is still in flight or unavailable. */
const FALLBACK_EXAMPLE =
  "Sit for a moment with today's verse. Notice one situation in the day " +
  'ahead where this teaching could land — a conversation, a small ' +
  'decision, a reaction you tend to repeat. Carry the verse there.';

function MovementPhaseInner({
  verse,
  onComplete,
}: MovementPhaseProps): React.JSX.Element {
  const example = useVerseModernExample(
    verse
      ? {
          chapter: verse.chapter,
          verse: verse.verse,
          sanskrit: verse.sanskrit,
          translation: verse.translation,
          ...(verse.transliteration
            ? { transliteration: verse.transliteration }
            : {}),
        }
      : null,
  );

  const showSpinner = example.isLoading && verse != null;
  const exampleText =
    (typeof example.data === 'string' && example.data.length > 0
      ? example.data
      : null) ?? (example.isError ? FALLBACK_EXAMPLE : null);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.phaseLabel} allowFontScaling={false}>
          PHASE V
        </Text>
        <Text style={styles.phaseName}>Application</Text>
        <Text style={styles.sanskrit} allowFontScaling={false}>
          व्यवहार · Vyavahara
        </Text>
      </View>

      <SacredCard style={styles.card}>
        <Text style={styles.cardLabel} allowFontScaling={false}>
          TODAY IN LIFE
        </Text>
        {verse ? (
          <Text style={styles.cardReference}>{verse.reference}</Text>
        ) : null}

        {showSpinner ? (
          <View style={styles.spinnerRow}>
            <ActivityIndicator color={GOLD} />
            <Text style={styles.spinnerText}>Sakha is drawing the scene…</Text>
          </View>
        ) : exampleText ? (
          <Text style={styles.cardBody}>{exampleText}</Text>
        ) : (
          <Text style={styles.cardBody}>{FALLBACK_EXAMPLE}</Text>
        )}
      </SacredCard>

      <View style={styles.helperBlock}>
        <Text style={styles.helper}>
          Carry one image from this into your day. The verse is no longer
          on the page — it is in the choice you make next.
        </Text>
      </View>

      <View style={styles.cta}>
        <DivineButton
          title="Complete Phase"
          variant="primary"
          onPress={onComplete}
          disabled={false}
        />
      </View>
    </View>
  );
}

/** Phase V — Vyavahara: a modern-day scene that brings the verse into life. */
export const MovementPhase = React.memo(MovementPhaseInner);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
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
  card: {
    gap: 10,
  },
  cardLabel: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    color: GOLD,
    letterSpacing: 1.8,
  },
  cardReference: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 16,
    color: SACRED_WHITE,
  },
  cardBody: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15,
    color: SACRED_WHITE,
    lineHeight: 24,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  spinnerText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
  },
  helperBlock: {
    paddingHorizontal: 4,
  },
  helper: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 20,
    textAlign: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: 'auto',
  },
});
