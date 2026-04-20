/**
 * VerseCard — Bhagavad Gita shloka display card.
 *
 * Shows chapter, verse, sanskrit text, transliteration, translation,
 * and speaker. Golden top-border accent. Tap to expand/collapse
 * commentary section with animated height transition.
 *
 * Entrance animation via Reanimated FadeInDown.
 */

import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { textPresets } from '../tokens/typography';
import { duration } from '../tokens/motion';
import { shadows } from '../tokens/shadows';
import { Text } from './Text';

/** Data structure for a single Gita verse. */
export interface VerseData {
  /** Chapter number (1-18). */
  readonly chapter: number;
  /** Verse number within the chapter. */
  readonly verse: number;
  /** Original Sanskrit text in Devanagari script. */
  readonly sanskrit: string;
  /** Romanized transliteration. */
  readonly transliteration: string;
  /** English (or localized) translation. */
  readonly translation: string;
  /** Speaker of the verse (e.g. "Lord Krishna", "Arjuna", "Sanjaya"). */
  readonly speaker: string;
  /** Optional commentary text — shown on expand. */
  readonly commentary?: string;
}

/** Props for the VerseCard component. */
export interface VerseCardProps {
  /** Verse data to display. */
  readonly verse: VerseData;
  /** Called when the card is tapped (before expand toggle). */
  readonly onPress?: () => void;
  /** Controls the FadeInDown entrance delay for staggered lists. @default 0 */
  readonly enterDelay?: number;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

function VerseCardInner({
  verse,
  onPress,
  enterDelay = 0,
  style,
  testID,
}: VerseCardProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const hasCommentary = verse.commentary !== undefined && verse.commentary.length > 0;
  const [expanded, setExpanded] = useState(false);

  const commentaryHeight = useSharedValue(0);
  const commentaryOpacity = useSharedValue(0);

  const handlePress = useCallback(() => {
    onPress?.();
    if (hasCommentary) {
      const toExpanded = !expanded;
      setExpanded(toExpanded);
      // Reanimated shared-value mutation — idiomatic worklet pattern.
      commentaryHeight.value = withTiming(toExpanded ? 1 : 0, {
        duration: duration.normal,
        easing: Easing.inOut(Easing.ease),
      });
      // Reanimated shared-value mutation — idiomatic worklet pattern.
      commentaryOpacity.value = withTiming(toExpanded ? 1 : 0, {
        duration: duration.normal,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [onPress, hasCommentary, expanded, commentaryHeight, commentaryOpacity]);

  const commentaryStyle = useAnimatedStyle(() => ({
    opacity: commentaryOpacity.value,
    maxHeight: commentaryHeight.value * 500,
    overflow: 'hidden' as const,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(enterDelay).duration(duration.slow).springify()}
      testID={testID}
      accessibilityRole="text"
      style={style}
    >
      <Pressable onPress={handlePress} disabled={!hasCommentary && !onPress}>
        <View style={[styles.card, shadows.sm, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          {/* Golden top accent bar */}
          <View style={[styles.topBar, { backgroundColor: c.accent }]} />

          {/* Chapter & Verse label */}
          <View style={styles.header}>
            <Text variant="caption" color={c.accentLight}>
              Chapter {verse.chapter} · Verse {verse.verse}
            </Text>
            <Text variant="caption" color={c.textTertiary}>
              {verse.speaker}
            </Text>
          </View>

          {/* Sanskrit text */}
          <Text
            style={[styles.sanskrit, { color: c.accent }]}
            accessibilityLabel={`Sanskrit: ${verse.sanskrit}`}
          >
            {verse.sanskrit}
          </Text>

          {/* Transliteration */}
          <Text variant="bodySmall" color={c.textSecondary} style={styles.transliteration}>
            {verse.transliteration}
          </Text>

          {/* Translation */}
          <Text variant="body" color={c.textPrimary} style={styles.translation}>
            {verse.translation}
          </Text>

          {/* Expandable commentary */}
          {hasCommentary ? (
            <Animated.View style={commentaryStyle}>
              <View style={[styles.commentaryDivider, { backgroundColor: c.divider }]} />
              <Text variant="bodySmall" color={c.textSecondary} style={styles.commentary}>
                {verse.commentary}
              </Text>
            </Animated.View>
          ) : null}

          {/* Expand hint */}
          {hasCommentary ? (
            <Text variant="caption" color={c.textTertiary} align="center" style={styles.expandHint}>
              {expanded ? 'Tap to collapse' : 'Tap for commentary'}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Bhagavad Gita verse display card with animated entrance and expandable commentary. */
export const VerseCard = React.memo(VerseCardInner);

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  topBar: {
    height: 3,
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sanskrit: {
    ...textPresets.sacred,
    marginBottom: spacing.xs,
  },
  transliteration: {
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  translation: {
    marginBottom: spacing.xs,
  },
  commentaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  commentary: {
    paddingBottom: spacing.xs,
  },
  expandHint: {
    marginTop: spacing.xxs,
  },
});
