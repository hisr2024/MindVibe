/**
 * SakhaMessage — left-aligned SAKHA chat bubble with word-by-word reveal.
 *
 * Port of the web SakhaMessageBubble with VerseRevelation:
 * - Layout: row [avatar column (28 px MandalaSpin) | bubble column].
 * - Bubble: SacredCard-style dark surface, radius [4,20,20,20].
 * - Left border accent: 2 px vertical LinearGradient Krishna-aura ribbon.
 * - Text: CrimsonText-Regular 16 px, lineHeight 1.75, TEXT_PRIMARY.
 * - Word-by-word: fade/slide in per word, 60 ms stagger.
 * - Sanskrit (Devanagari) spans get NotoSansDevanagari-Regular 17 px #D4A017.
 * - Streaming cursor: the last word gets a blinking `|` (600 ms loop).
 * - Stream complete: a golden shimmer sweeps across the text via a gradient
 *   overlay — simple, performant, no Skia clipping tricks required.
 *
 * Optional `shloka` prop renders a ShlokaCard inside the bubble below the
 * prose (if provided).
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MandalaSpin: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  MandalaSpin = require('@kiaanverse/ui').MandalaSpin ?? null;
} catch {
  MandalaSpin = null;
}

const GOLD = '#D4A017';
const TEXT_PRIMARY = '#F5F0E8';
const BUBBLE_BG = 'rgba(19,26,61,0.92)';
const AVATAR_SIZE = 28;
const WORD_STAGGER_MS = 60;
const MAX_WIDTH_PERCENT = 0.82;

/** Krishna-aura vertical gradient for the left border ribbon. */
const KRISHNA_AURA: readonly [string, string, string] = [
  'rgba(27,79,187,0.9)',
  'rgba(66,41,155,0.9)',
  'rgba(212,160,23,0.9)',
];

/** Optional shloka payload. */
export interface SakhaMessageShloka {
  readonly sanskrit?: string;
  readonly transliteration?: string;
  readonly meaning?: string;
  readonly reference?: string;
}

export interface SakhaMessageProps {
  /** Message text. Devanagari substrings are auto-highlighted in gold. */
  readonly text: string;
  /** Whether this message is still streaming (controls cursor + shimmer). */
  readonly isStreaming?: boolean;
  /** Optional shloka card rendered inline at the bottom of the bubble. */
  readonly shloka?: SakhaMessageShloka;
  /** Stable message id for keying. */
  readonly id?: string;
}

/** Regex that splits text into whitespace vs. non-whitespace runs. */
const TOKEN_SPLIT_RE = /(\s+)/;

/** Matches a Devanagari run (Sanskrit). */
const DEVANAGARI_RE = /[\u0900-\u097F]/;

interface Token {
  readonly key: string;
  readonly text: string;
  readonly isWhitespace: boolean;
  readonly isDevanagari: boolean;
}

function tokenize(text: string): Token[] {
  return text
    .split(TOKEN_SPLIT_RE)
    .filter((part) => part.length > 0)
    .map((part, i) => ({
      key: `t-${i}`,
      text: part,
      isWhitespace: /^\s+$/.test(part),
      isDevanagari: DEVANAGARI_RE.test(part),
    }));
}

/** A single word that fades in as the reveal reaches its index.
 *
 *  Only opacity is animated because `transform` is not supported on Text
 *  nodes nested inside a parent Text on Android — slide-in would be a
 *  no-op and falsely imply motion.
 */
interface WordProps {
  readonly token: Token;
  readonly index: number;
  readonly revealIndex: number;
}

function Word({ token, index, revealIndex }: WordProps): React.JSX.Element {
  const opacity = useSharedValue(0);
  const hasRevealedRef = React.useRef(false);

  useEffect(() => {
    if (hasRevealedRef.current) return;
    if (index > revealIndex) return;
    hasRevealedRef.current = true;
    // Stagger relative to the most recently revealed word so we don't
    // pile up enormous delays on long responses.
    const delay = Math.max(
      0,
      (index - Math.max(revealIndex - 6, 0)) * WORD_STAGGER_MS,
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
    );
  }, [index, revealIndex, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (token.isWhitespace) {
    // Whitespace preserved inline (collapses in Text node).
    return <Text style={styles.bodyText}>{token.text}</Text>;
  }

  const textStyle = token.isDevanagari ? styles.sanskritText : styles.bodyText;

  return (
    <Animated.Text style={[textStyle, animatedStyle]}>
      {token.text}
    </Animated.Text>
  );
}

/** Blinking streaming cursor: `|` that fades 0 ↔ 1 over 600 ms. */
function StreamingCursor(): React.JSX.Element {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.cursor, animatedStyle]}>|</Animated.Text>
  );
}

/** Golden shimmer that sweeps across the bubble after streaming ends. */
function CompletionShimmer(): React.JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 1 ? 0.55 : 0,
    transform: [
      { translateX: -120 + progress.value * 360 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shimmerWrap, animatedStyle]}
    >
      <LinearGradient
        colors={['transparent', 'rgba(240,192,64,0.45)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmerFill}
      />
    </Animated.View>
  );
}

function SakhaMessageInner({
  text,
  isStreaming,
  shloka,
  id,
}: SakhaMessageProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const maxWidth = Math.round(width * MAX_WIDTH_PERCENT);

  const tokens = useMemo(() => tokenize(text), [text]);
  const lastNonWhitespace = useMemo(() => {
    for (let i = tokens.length - 1; i >= 0; i--) {
      const tok = tokens[i];
      if (tok && !tok.isWhitespace) return i;
    }
    return -1;
  }, [tokens]);

  // Reveal index grows as the text grows, so every new token fades in.
  const revealIndex = tokens.length - 1;

  // When streaming flips from true → false, render the shimmer once.
  const [shimmerKey, setShimmerKey] = React.useState<number | null>(null);
  const prevStreamingRef = React.useRef<boolean | undefined>(isStreaming);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      setShimmerKey(Date.now());
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  return (
    <View style={styles.outer} testID={id ? `sakha-msg-${id}` : undefined}>
      {/* Avatar column */}
      <View style={styles.avatarCol}>
        <View style={styles.avatar}>
          {MandalaSpin ? (
            <MandalaSpin
              size={AVATAR_SIZE}
              speed={isStreaming ? 'fast' : 'slow'}
              opacity={0.9}
              color={GOLD}
            />
          ) : (
            <View style={styles.avatarFallback} />
          )}
        </View>
      </View>

      {/* Bubble column */}
      <View style={[styles.bubble, { maxWidth }]}>
        {/* Left border accent — vertical Krishna-aura ribbon. */}
        <LinearGradient
          colors={KRISHNA_AURA as unknown as string[]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.leftAccent}
        />

        <View style={styles.bubbleBody}>
          <Text style={styles.bodyText}>
            {tokens.map((token, i) => {
              const isLastWord = i === lastNonWhitespace;
              return (
                <React.Fragment key={token.key}>
                  <Word token={token} index={i} revealIndex={revealIndex} />
                  {isStreaming && isLastWord ? <StreamingCursor /> : null}
                </React.Fragment>
              );
            })}
          </Text>

          {/* Optional inline shloka card. */}
          {shloka ? <InlineShloka shloka={shloka} /> : null}
        </View>

        {shimmerKey ? <CompletionShimmer key={shimmerKey} /> : null}
      </View>
    </View>
  );
}

/** Lightweight inline shloka renderer — used inside SakhaMessage bubbles. */
function InlineShloka({ shloka }: { shloka: SakhaMessageShloka }): React.JSX.Element {
  return (
    <View style={styles.shloka}>
      {shloka.sanskrit ? (
        <Text style={styles.shlokaSanskrit}>{shloka.sanskrit}</Text>
      ) : null}
      {shloka.transliteration ? (
        <Text style={styles.shlokaTranslit}>{shloka.transliteration}</Text>
      ) : null}
      {shloka.meaning ? (
        <Text style={styles.shlokaMeaning}>{shloka.meaning}</Text>
      ) : null}
      {shloka.reference ? (
        <Text style={styles.shlokaRef}>Chapter {shloka.reference}</Text>
      ) : null}
    </View>
  );
}

/** Left-aligned SAKHA bubble with word-by-word reveal. */
export const SakhaMessage = React.memo(SakhaMessageInner);

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingVertical: 4,
    gap: 8,
  },
  avatarCol: {
    width: AVATAR_SIZE,
    alignItems: 'center',
    paddingTop: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    borderColor: GOLD,
  },
  bubble: {
    flexShrink: 1,
    backgroundColor: BUBBLE_BG,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 14,
    // Elevation so the bubble reads above the sub-mandala texture.
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.15)',
  },
  leftAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
  },
  bubbleBody: {
    paddingLeft: 6,
  },
  bodyText: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    lineHeight: 28, // 16 × 1.75 = 28
    color: TEXT_PRIMARY,
  },
  sanskritText: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 17,
    lineHeight: 30,
    color: GOLD,
  },
  cursor: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    lineHeight: 28,
    color: GOLD,
  },
  shloka: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,160,23,0.18)',
    gap: 6,
  },
  shlokaSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 17,
    lineHeight: 30,
    color: GOLD,
  },
  shlokaTranslit: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(200,191,168,0.9)',
  },
  shlokaMeaning: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  shlokaRef: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    color: GOLD,
    textAlign: 'right',
    letterSpacing: 0.4,
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 140,
  },
  shimmerFill: {
    flex: 1,
    width: '100%',
  },
});
