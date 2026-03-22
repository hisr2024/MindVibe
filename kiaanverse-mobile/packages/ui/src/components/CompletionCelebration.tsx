/**
 * CompletionCelebration — Golden confetti + XP award animation.
 *
 * Renders animated golden particles radiating from center when triggered.
 * Shows XP and karma point awards with spring scale-in animations.
 * Auto-dismisses after duration.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { Text } from './Text';

/** Props for the CompletionCelebration component. */
export interface CompletionCelebrationProps {
  /** Whether to show the celebration. */
  readonly visible: boolean;
  /** XP earned. */
  readonly xp: number;
  /** Karma points earned. */
  readonly karmaPoints: number;
  /** Optional message to display. */
  readonly message?: string;
  /** Called when the animation finishes. */
  readonly onDismiss?: () => void;
  /** Auto-dismiss duration in ms. @default 3000 */
  readonly duration?: number;
  /** Optional container style. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#F0C040', '#E8B54A'];

function Particle({ index, visible }: { index: number; visible: boolean }): React.JSX.Element {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length] ?? '#FFD700';

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      progress.value = withDelay(
        index * 40,
        withSpring(1, { damping: 8, stiffness: 120 }),
      );
      opacity.value = withDelay(
        index * 40,
        withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(800, withTiming(0, { duration: 600 })),
        ),
      );
    } else {
      progress.value = 0;
      opacity.value = 0;
    }
  }, [visible, index, progress, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = progress.value * 80;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: 1 - progress.value * 0.5 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

function CompletionCelebrationInner({
  visible,
  xp,
  karmaPoints,
  message,
  onDismiss,
  duration = 3000,
  style,
  testID,
}: CompletionCelebrationProps): React.JSX.Element | null {
  const { theme } = useTheme();
  const c = theme.colors;

  const containerScale = useSharedValue(0);
  const xpScale = useSharedValue(0);
  const karmaScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      containerScale.value = withSpring(1, { damping: 12, stiffness: 150 });
      xpScale.value = withDelay(400, withSpring(1, { damping: 10, stiffness: 200 }));
      karmaScale.value = withDelay(600, withSpring(1, { damping: 10, stiffness: 200 }));

      if (onDismiss) {
        const timer = setTimeout(() => onDismiss(), duration);
        return () => clearTimeout(timer);
      }
    } else {
      containerScale.value = 0;
      xpScale.value = 0;
      karmaScale.value = 0;
    }
    return undefined;
  }, [visible, containerScale, xpScale, karmaScale, onDismiss, duration]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerScale.value,
  }));

  const xpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const karmaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: karmaScale.value }],
  }));

  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  if (!visible) return null;

  return (
    <View style={[styles.overlay, style]} testID={testID} accessibilityRole="alert">
      {/* Golden particles */}
      <View style={styles.particleContainer}>
        {particles.map((i) => (
          <Particle key={i} index={i} visible={visible} />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, containerStyle]}>
        <Text variant="h2" color={c.accent} align="center">
          ✨
        </Text>
        {message ? (
          <Text variant="label" color={c.textPrimary} align="center">
            {message}
          </Text>
        ) : null}

        <View style={styles.rewardsRow}>
          <Animated.View style={[styles.rewardBadge, { backgroundColor: c.card }, xpStyle]}>
            <Text variant="h3" color={c.accent}>+{xp}</Text>
            <Text variant="caption" color={c.textSecondary}>XP</Text>
          </Animated.View>

          {karmaPoints > 0 ? (
            <Animated.View style={[styles.rewardBadge, { backgroundColor: c.card }, karmaStyle]}>
              <Text variant="h3" color={c.accent}>+{karmaPoints}</Text>
              <Text variant="caption" color={c.textSecondary}>Karma</Text>
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

/** Golden confetti celebration with XP and karma point award animations. */
export const CompletionCelebration = React.memo(CompletionCelebrationInner);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  particleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rewardBadge: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.xxs,
  },
});
