/**
 * ShlokaCard — Elevated verse card: Sanskrit + transliteration + meaning.
 *
 * Web parity:
 * - Background rgba(212,160,23,0.06).
 * - Border 1px rgba(212,160,23,0.25), radius 12.
 * - Top shimmer strip (2px gold horizontal gradient).
 * - Sanskrit (Devanagari) bold 17px gold — entrance via VerseRevelation.
 * - Transliteration italic Crimson 13px secondary.
 * - Meaning Outfit 14px primary, loose line-height.
 * - Chapter ref Outfit 10px muted, right-aligned.
 *
 * Designed to nest inside SAKHA chat bubbles. Safe for long verses (no
 * horizontal overflow thanks to flex-wrap in VerseRevelation).
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VerseRevelation } from './VerseRevelation';

const BG = 'rgba(212, 160, 23, 0.06)';
const BORDER = 'rgba(212, 160, 23, 0.25)';
const GOLD = '#D4A017';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';

const TOP_SHIMMER = [
  'rgba(212, 160, 23, 0)',
  'rgba(240, 192, 64, 0.9)',
  'rgba(212, 160, 23, 0)',
] as const;

export interface ShlokaCardProps {
  /** Devanagari text of the shloka (will be revealed word-by-word). */
  readonly sanskrit: string;
  /** Latin transliteration (IAST) — optional. */
  readonly transliteration?: string;
  /** English (or localised) meaning. */
  readonly meaning?: string;
  /** Chapter reference (e.g., "Bhagavad Gita 2.47"). */
  readonly reference?: string;
  /** Override the reveal delay for the Sanskrit words (ms). @default 0 */
  readonly revealDelay?: number;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function ShlokaCardInner({
  sanskrit,
  transliteration,
  meaning,
  reference,
  revealDelay = 0,
  style,
  testID,
}: ShlokaCardProps): React.JSX.Element {
  return (
    <View style={[styles.card, style]} testID={testID}>
      <LinearGradient
        colors={TOP_SHIMMER as unknown as string[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topShimmer}
        pointerEvents="none"
      />
      <View style={styles.body}>
        <VerseRevelation
          text={sanskrit}
          textStyle={styles.sanskrit}
          delay={revealDelay}
          containerStyle={styles.sanskritFlow}
        />

        {transliteration ? (
          <Text style={styles.transliteration}>{transliteration}</Text>
        ) : null}

        {meaning ? <Text style={styles.meaning}>{meaning}</Text> : null}

        {reference ? (
          <Text style={styles.reference}>{reference}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** Shloka card with Sanskrit reveal, transliteration, meaning, reference. */
export const ShlokaCard = React.memo(ShlokaCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG,
    overflow: 'hidden',
  },
  topShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 2,
  },
  body: {
    padding: 16,
    gap: 8,
  },
  sanskritFlow: {
    marginTop: 2,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Medium',
    fontSize: 17,
    lineHeight: 34,
    color: GOLD,
    fontWeight: '700',
  },
  transliteration: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 20,
  },
  meaning: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 14 * 1.7,
  },
  reference: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: TEXT_MUTED,
    textAlign: 'right',
    marginTop: 4,
    letterSpacing: 0.4,
  },
});
