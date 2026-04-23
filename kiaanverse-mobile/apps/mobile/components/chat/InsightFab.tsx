/**
 * InsightFab — floating "spark" button that seeds a reflection prompt.
 *
 * Bottom-right floating action button shown while the chat is idle.
 * Tapping it fires a Light haptic and delivers a curated reflection
 * prompt to the parent so the user can send it immediately without
 * typing. The button breathes continuously and pulses when pressed.
 */

import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';

/** Curated insight-seed prompts, rotated by day-of-year for deterministic
 *  daily variety without a network round-trip. */
const INSIGHT_PROMPTS: readonly string[] = [
  'Share a verse for this moment of my life.',
  'Give me one line from the Gita I can hold today.',
  'What does Krishna teach about letting go?',
  'How do I act without attachment to results?',
  'What is the dharma of this breath?',
  'Teach me equanimity in a single verse.',
  'What does the Gita say about fear?',
];

function LightbulbIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18 h6" />
      <Path d="M10 21 h4" />
      <Path d="M12 3 a6 6 0 0 1 4 10.5 c-.7.6 -1 1.4 -1 2.2 V17 h-6 v-1.3 c0 -.8 -.3 -1.6 -1 -2.2 A6 6 0 0 1 12 3 Z" />
      <Circle cx={12} cy={9} r={0.9} fill={color} />
    </Svg>
  );
}

export interface InsightFabProps {
  /** Called with a seed prompt when the user taps the FAB. */
  readonly onPress: (prompt: string) => void;
  /** Hide the FAB while Sakha is streaming. @default false */
  readonly hidden?: boolean;
  /** Bottom offset in points (above the input bar). @default 96 */
  readonly bottomOffset?: number;
}

function InsightFabInner({
  onPress,
  hidden = false,
  bottomOffset = 96,
}: InsightFabProps): React.JSX.Element | null {
  const breath = useSharedValue(0);
  const press = useSharedValue(1);
  const visibility = useSharedValue(hidden ? 0 : 1);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [breath]);

  useEffect(() => {
    visibility.value = withTiming(hidden ? 0 : 1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [hidden, visibility]);

  const handlePressIn = useCallback(() => {
    press.value = withTiming(0.92, { duration: 80 });
  }, [press]);

  const handlePressOut = useCallback(() => {
    press.value = withSpring(1, { damping: 14, stiffness: 260, mass: 0.7 });
  }, [press]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const index = dayOfYear % INSIGHT_PROMPTS.length;
    const prompt = INSIGHT_PROMPTS[index] ?? INSIGHT_PROMPTS[0]!;
    onPress(prompt);
  }, [onPress]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (0.3 + breath.value * 0.35) * visibility.value,
    transform: [{ scale: 1 + breath.value * 0.15 }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [
      { scale: press.value * (0.94 + visibility.value * 0.06) },
    ],
  }));

  if (hidden && visibility.value === 0) {
    // Still render — the animated opacity handles visibility without
    // unmounting. Return the view.
  }

  return (
    <View
      style={[styles.wrap, { bottom: bottomOffset }]}
      pointerEvents={hidden ? 'none' : 'box-none'}
    >
      <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />
      <Animated.View style={containerStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Seed a reflection"
          accessibilityHint="Inserts a short Gita-rooted prompt into the message"
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          hitSlop={6}
          style={styles.button}
        >
          <LinearGradient
            colors={['rgba(27,79,187,0.95)', 'rgba(14,116,144,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LightbulbIcon color={GOLD} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Floating lightbulb FAB that injects a curated reflection prompt. */
export const InsightFab = React.memo(InsightFabInner);

const BUTTON_SIZE = 56;
const HALO_SIZE = 80;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 16,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: 'rgba(212,160,23,0.22)',
    shadowColor: GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(212,160,23,0.65)',
  },
});
