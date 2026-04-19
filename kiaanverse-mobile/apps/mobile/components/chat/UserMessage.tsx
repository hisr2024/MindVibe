/**
 * UserMessage — right-aligned user chat bubble.
 *
 * Port of the web user message bubble:
 * - Alignment: flex-end (right side).
 * - Background: Krishna-aura LinearGradient at 135°.
 * - BorderRadius: [20, 4, 20, 20] — the top-right corner is sharp and acts
 *   as the bubble tail pointing at the sender.
 * - Padding: 12 × 16.
 * - Text: Outfit-Regular 15 px #F5F0E8 (SACRED_WHITE).
 * - Max width: 72 % of screen.
 * - Entrance: translateX(16 → 0) + opacity(0 → 1), ~180 ms ease-out.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SACRED_WHITE = '#F5F0E8';
const MAX_WIDTH_PERCENT = 0.72;

/** Krishna-aura gradient stops — matches web KRISHNA_AURA gradient. */
const KRISHNA_AURA: readonly [string, string, string] = [
  'rgba(27,79,187,0.95)',
  'rgba(66,41,155,0.9)',
  'rgba(212,160,23,0.6)',
];

export interface UserMessageProps {
  /** Rendered message text. */
  readonly text: string;
  /** Stable message id (used as accessibility hint). */
  readonly id?: string;
}

function UserMessageInner({ text, id }: UserMessageProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const maxWidth = Math.round(width * MAX_WIDTH_PERCENT);

  const translateX = useSharedValue(16);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateX, opacity]);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[styles.outer, entranceStyle]}
      accessibilityRole="text"
      accessibilityLabel={`You said: ${text}`}
      testID={id ? `user-msg-${id}` : undefined}
    >
      <View style={[styles.bubble, { maxWidth }]}>
        <LinearGradient
          colors={KRISHNA_AURA as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.Text style={styles.text}>{text}</Animated.Text>
      </View>
    </Animated.View>
  );
}

/** Right-aligned user message bubble with Krishna-aura gradient. */
export const UserMessage = React.memo(UserMessageInner);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    // [topLeft, topRight, bottomRight, bottomLeft] — matches web [20,4,20,20].
    borderTopLeftRadius: 20,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
  },
  text: {
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: SACRED_WHITE,
  },
});
