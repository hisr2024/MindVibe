/**
 * VerseCard — Sacred Bhagavad Gita verse display.
 *
 * Renders a verse with the sacred header, chapter.verse reference,
 * Sanskrit text in Devanagari script, transliteration, English and
 * optionally Hindi translations. Wrapped in a GlowCard with a
 * MandalaSpin subtle background.
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Text,
  GlowCard,
  MandalaSpin,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerseCardProps {
  /** Chapter.Verse reference, e.g. "2.47" */
  readonly verseRef: string;
  /** Sanskrit text in Devanagari script. */
  readonly sanskrit?: string | undefined;
  /** Romanized transliteration of the Sanskrit. */
  readonly transliteration?: string | undefined;
  /** English translation of the verse. */
  readonly englishTranslation?: string | undefined;
  /** Hindi translation of the verse (toggleable). */
  readonly hindiTranslation?: string | undefined;
  /** Accent color for decorative elements. */
  readonly accentColor?: string | undefined;
}

// ---------------------------------------------------------------------------
// VerseCard
// ---------------------------------------------------------------------------

export function VerseCard({
  verseRef,
  sanskrit,
  transliteration,
  englishTranslation,
  hindiTranslation,
  accentColor = colors.primary[500],
}: VerseCardProps): React.JSX.Element {
  const [showHindi, setShowHindi] = useState(false);

  const toggleHindi = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHindi((prev) => !prev);
  }, []);

  return (
    <GlowCard variant="sacred" style={styles.card}>
      {/* Subtle mandala background */}
      <View style={styles.mandalaContainer} pointerEvents="none">
        <MandalaSpin size={200} color={colors.alpha.goldLight} speed="slow" />
      </View>

      {/* Sacred header */}
      <View style={styles.header}>
        <View style={[styles.omCircle, { borderColor: accentColor }]}>
          <Text variant="h3" color={colors.divine.aura} align="center">
            {'\u0950'}
          </Text>
        </View>
        <Text variant="caption" color={colors.text.muted}>
          {
            '\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E'
          }
        </Text>
      </View>

      {/* Chapter.Verse reference */}
      <View style={[styles.refBadge, { backgroundColor: `${accentColor}20` }]}>
        <Text variant="caption" color={accentColor}>
          Verse {verseRef}
        </Text>
      </View>

      {/* Sanskrit text */}
      {sanskrit ? (
        <Text
          variant="h3"
          color={colors.divine.aura}
          align="center"
          style={styles.sanskritText}
        >
          {sanskrit}
        </Text>
      ) : null}

      {/* Transliteration */}
      {transliteration ? (
        <Text
          variant="bodySmall"
          color={colors.text.muted}
          align="center"
          style={styles.transliteration}
        >
          {transliteration}
        </Text>
      ) : null}

      {/* English translation */}
      {englishTranslation ? (
        <>
          <View style={styles.divider} />
          <Text
            variant="body"
            color={colors.text.primary}
            align="center"
            style={styles.translation}
          >
            {englishTranslation}
          </Text>
        </>
      ) : null}

      {/* Hindi translation toggle */}
      {hindiTranslation ? (
        <>
          <Pressable
            onPress={toggleHindi}
            style={styles.toggleRow}
            accessibilityRole="button"
          >
            <Text variant="caption" color={colors.primary[300]}>
              {showHindi ? 'Hide Hindi Translation' : 'Show Hindi Translation'}
            </Text>
          </Pressable>

          {showHindi ? (
            <Text
              variant="body"
              color={colors.text.secondary}
              align="center"
              style={styles.translation}
            >
              {hindiTranslation}
            </Text>
          ) : null}
        </>
      ) : null}
    </GlowCard>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  mandalaContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  omCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alpha.goldLight,
  },
  refBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  sanskritText: {
    lineHeight: 36,
    letterSpacing: 0.5,
  },
  transliteration: {
    fontStyle: 'italic',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.alpha.goldLight,
    marginVertical: spacing.xs,
  },
  translation: {
    lineHeight: 24,
  },
  toggleRow: {
    alignSelf: 'center',
    paddingVertical: spacing.xxs,
  },
});
