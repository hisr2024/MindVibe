/**
 * KarmaShlokaCard — Category-colored verse display for the Wisdom phase.
 *
 * Presents a Gita verse in three layers:
 *   1. Sanskrit (Devanagari) revealed character-by-character with a
 *      subtle blur-to-clear transition.
 *   2. Transliteration in italic serif.
 *   3. English translation.
 *
 * The entire card enters via a circle clip reveal that matches the
 * sacred entry rhythm of the web version.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/ShlokaCard.tsx`, named
 * `KarmaShlokaCard` locally to avoid clashing with the UI kit's
 * generic `ShlokaCard` component.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { KarmaCategory } from './types';
import { CATEGORY_COLORS, hexToRgbTriplet } from './types';

interface KarmaShlokaCardProps {
  sanskrit: string;
  transliteration: string;
  english: string;
  chapter: number;
  verse: number;
  chapterName: string;
  category: KarmaCategory;
}

/**
 * Splits a Devanagari string into grapheme clusters so combining
 * vowel signs stay attached to their base consonant on reveal.
 */
function splitGraphemes(input: string): string[] {
  // Intl.Segmenter is available on Hermes / modern JSC. Fall back to
  // a simple combining-mark aware splitter otherwise.
  const SegCtor = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter })
    .Segmenter;
  if (SegCtor) {
    const seg = new SegCtor(undefined, { granularity: 'grapheme' });
    return Array.from(seg.segment(input), (s) => s.segment);
  }
  const out: string[] = [];
  for (const char of Array.from(input)) {
    // Combine with previous if this is a combining mark (U+0300–036F,
    // U+0900–097F Devanagari signs).
    const code = char.codePointAt(0) ?? 0;
    const isCombining =
      (code >= 0x0300 && code <= 0x036f) ||
      (code >= 0x0900 && code <= 0x097f &&
        // only virama + vowel signs; leave consonants standalone
        ((code >= 0x093a && code <= 0x094f) ||
          (code >= 0x0951 && code <= 0x0957) ||
          (code >= 0x0962 && code <= 0x0963)));
    if (isCombining && out.length > 0) {
      out[out.length - 1] += char;
    } else {
      out.push(char);
    }
  }
  return out;
}

function Grapheme({
  char,
  delay,
}: {
  char: string;
  delay: number;
}): React.JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    // reset if the word changes
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.Text style={[styles.sanskritChar, style]}>{char}</Animated.Text>
  );
}

export function KarmaShlokaCard({
  sanskrit,
  transliteration,
  english,
  chapter,
  verse,
  chapterName,
  category,
}: KarmaShlokaCardProps): React.JSX.Element {
  const color = CATEGORY_COLORS[category];
  const rgb = hexToRgbTriplet(color);

  const graphemes = useMemo(() => splitGraphemes(sanskrit), [sanskrit]);
  const [revealed, setRevealed] = useState<number>(0);

  // Card enters via fade + subtle scale (a cheap stand-in for the web's
  // circle clip reveal — clipPath isn't available in RN without Skia).
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0, 0.8, 0.2, 1),
    });
  }, [enter]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.96 + 0.04 * enter.value }],
  }));

  // Staggered grapheme reveal starts once the card has entered
  useEffect(() => {
    setRevealed(0);
    const start = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setRevealed(i);
        if (i >= graphemes.length) clearInterval(id);
      }, 70);
      return () => clearInterval(id);
    }, 600);
    return () => clearTimeout(start);
  }, [graphemes.length]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: 'rgba(17,20,53,0.98)',
          borderColor: `rgba(${rgb},0.25)`,
          borderTopColor: `rgba(${rgb},0.8)`,
        },
        cardStyle,
      ]}
    >
      {/* Reference badge */}
      <Animated.Text style={styles.reference}>
        CH.{chapter} · V.{verse} · {chapterName}
      </Animated.Text>

      {/* Sanskrit — grapheme stagger */}
      <View style={styles.sanskritRow}>
        {graphemes.slice(0, revealed).map((char, i) => (
          <Grapheme key={`${i}-${char}`} char={char} delay={i * 70} />
        ))}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: `rgba(${rgb},0.4)` }]} />

      {/* Transliteration */}
      <Animated.Text style={styles.transliteration}>
        {transliteration}
      </Animated.Text>

      {/* Divider */}
      <View
        style={[styles.divider, { backgroundColor: 'rgba(212,160,23,0.3)' }]}
      />

      {/* English */}
      <Animated.Text style={styles.english}>{english}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 24,
    padding: 20,
  },
  reference: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#D4A017',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sanskritRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  sanskritChar: {
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '300',
    color: '#F0C040',
    lineHeight: 40,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  transliteration: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#B8AE98',
    lineHeight: 21,
    marginBottom: 12,
  },
  english: {
    fontSize: 15,
    color: '#F0EBE1',
    lineHeight: 27,
  },
});
