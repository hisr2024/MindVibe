/**
 * RenewalBlessing — Displays a sacred blessing, Gita verse, and karma points.
 *
 * A golden-bordered card with shimmering border animation, elegant typography,
 * and a karma-points badge. Used on the final phase of the Karma Reset ritual.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { Text, Card, Divider, colors, spacing, radii } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Verse {
  readonly chapter: number;
  readonly verse: number;
  readonly text: string;
  readonly translation: string;
}

interface RenewalBlessingProps {
  readonly blessing: string;
  readonly verse: Verse;
  readonly karmaPoints: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RenewalBlessing({
  blessing,
  verse,
  karmaPoints,
}: RenewalBlessingProps): React.JSX.Element {
  const borderOpacity = useSharedValue(0.4);

  // Subtle golden shimmer on the border
  useEffect(() => {
    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [borderOpacity]);

  const borderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.wrapper}>
      {/* Shimmering border layer */}
      <Animated.View style={[styles.borderGlow, borderStyle]} />

      <Card style={styles.card}>
        {/* Blessing */}
        <Text variant="label" color={colors.primary[300]} align="center">
          Sacred Blessing
        </Text>
        <Text
          variant="body"
          color={colors.text.primary}
          align="center"
          style={styles.blessingText}
        >
          {blessing}
        </Text>

        <Divider />

        {/* Verse */}
        <Text variant="caption" color={colors.text.muted} align="center">
          Bhagavad Gita {verse.chapter}.{verse.verse}
        </Text>
        <Text
          variant="body"
          color={colors.primary[200]}
          align="center"
          style={styles.sanskritText}
        >
          {verse.text}
        </Text>
        <Text variant="bodySmall" color={colors.text.secondary} align="center">
          {verse.translation}
        </Text>

        <Divider />

        {/* Karma points badge */}
        <View style={styles.karmaRow}>
          <View style={styles.karmaBadge}>
            <Text variant="label" color={colors.background.dark} align="center">
              ✨ +{karmaPoints} Karma
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginHorizontal: spacing.md,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  card: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
  },
  blessingText: {
    lineHeight: 26,
    fontStyle: 'italic',
  },
  sanskritText: {
    lineHeight: 28,
    paddingVertical: spacing.xs,
  },
  karmaRow: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  karmaBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
  },
});
