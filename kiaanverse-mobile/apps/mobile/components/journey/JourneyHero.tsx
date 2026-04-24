/**
 * JourneyHero — immersive full-width gradient top for the detail screen.
 *
 * Composes:
 *   - A multi-stop LinearGradient themed in the ripu's color (alpha-
 *     fading from the accent through a deep navy into the cosmic
 *     backdrop so the header melts into the rest of the screen).
 *   - A giant Devanagari invocation of the enemy's name (32 px
 *     NotoSansDevanagari in the ripu color), flanked by its English
 *     translation and an optional ripu symbol glyph.
 *   - The journey's human title underneath the Sanskrit so the hero
 *     acts as both visual identity and orientation.
 *
 * The component is intentionally dumb — it takes a resolved ripu and a
 * title + description and renders. The detail screen decides whether
 * the gradient should be active, and is free to mount `DayProgressRing`
 * below this hero.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NEUTRAL_ACCENT, ripuAlpha, type Ripu } from './ripus';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.75)';

export interface JourneyHeroProps {
  /** Ripu metadata (drives color + Sanskrit). Null falls back to gold. */
  readonly ripu: Ripu | null;
  /** Journey title (rendered under the Sanskrit). */
  readonly title: string;
  /** Short description below the title. */
  readonly description?: string;
  /** Accessibility label override for the Sanskrit heading. */
  readonly accessibilityLabel?: string;
  /** Optional outer style override. */
  readonly style?: ViewStyle;
}

function JourneyHeroInner({
  ripu,
  title,
  description,
  accessibilityLabel,
  style,
}: JourneyHeroProps): React.JSX.Element {
  const accent = ripu?.color ?? NEUTRAL_ACCENT;

  // 3-stop gradient: saturated accent at the top, deep navy middle, and
  // full-transparency bottom so the cosmic background shows through.
  const gradient = [
    ripuAlpha(accent, 0.45),
    ripuAlpha(accent, 0.12),
    'rgba(5,7,20,0)',
  ] as const;

  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={gradient as unknown as string[]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.inner}>
        {ripu ? (
          <View style={styles.ripuRow}>
            <Text style={styles.symbol} allowFontScaling={false}>
              {ripu.symbol}
            </Text>
            <Text style={[styles.english, { color: accent }]} numberOfLines={1}>
              {ripu.name.toUpperCase()}
            </Text>
          </View>
        ) : null}

        <Text
          style={[styles.sanskrit, { color: accent }]}
          numberOfLines={1}
          allowFontScaling={false}
          accessibilityRole="header"
          accessibilityLabel={accessibilityLabel ?? ripu?.name ?? title}
        >
          {ripu?.sanskrit ?? 'यात्रा'}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {description ? (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Immersive full-width ripu-themed gradient hero. */
export const JourneyHero = React.memo(JourneyHeroInner);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
  },
  inner: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  ripuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  symbol: {
    fontSize: 18,
  },
  english: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 32,
    // 32 × 1.25 = 40 — tight enough to feel monumental.
    lineHeight: 42,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 22,
    color: SACRED_WHITE,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: 2,
    lineHeight: 28,
  },
  description: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
});
