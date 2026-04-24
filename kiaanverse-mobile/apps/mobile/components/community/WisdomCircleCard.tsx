/**
 * WisdomCircleCard — Grid card for displaying a wisdom circle.
 *
 * Shows circle name (2 lines max), description, member count badge,
 * and joined indicator. Pressable, navigates to circle detail on tap.
 * Uses scale animation for press feedback.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Text, Badge, colors, spacing } from '@kiaanverse/ui';
import type { CommunityCircle } from '@kiaanverse/api';

export interface WisdomCircleCardProps {
  /** The circle data to display */
  readonly circle: CommunityCircle;
  /** Callback when the card is pressed, receives the circle */
  readonly onPress: (circle: CommunityCircle) => void;
  /** Optional fixed width for grid layouts */
  readonly width?: number;
}

function WisdomCircleCardInner({
  circle,
  onPress,
  width,
}: WisdomCircleCardProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(circle);
  }, [circle, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Wisdom circle: ${circle.name}`}
    >
      <Animated.View
        style={[styles.card, animatedStyle, width ? { width } : undefined]}
      >
        {/* Circle Avatar / Icon */}
        <View style={styles.iconContainer}>
          <Text variant="h2" align="center">
            {circle.iconUrl ? '🔮' : '🕉️'}
          </Text>
        </View>

        {/* Name */}
        <Text
          variant="body"
          color={colors.text.primary}
          numberOfLines={2}
          style={styles.name}
        >
          {circle.name}
        </Text>

        {/* Description */}
        <Text
          variant="caption"
          color={colors.text.muted}
          numberOfLines={2}
          style={styles.description}
        >
          {circle.description}
        </Text>

        {/* Footer: member count + joined indicator */}
        <View style={styles.footer}>
          <Badge label={`${circle.memberCount}`} />
          {circle.isJoined ? (
            <Text variant="caption" color={colors.semantic.success}>
              {'✓'}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const WisdomCircleCard = React.memo(WisdomCircleCardInner);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    minHeight: 160,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  name: {
    fontWeight: '600',
  },
  description: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
});
