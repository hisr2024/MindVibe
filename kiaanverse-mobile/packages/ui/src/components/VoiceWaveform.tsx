/**
 * VoiceWaveform — Golden animated waveform bars for voice recording.
 *
 * Renders 7 vertical bars whose heights oscillate via Math.sin + time,
 * creating a smooth, organic waveform effect during recording.
 *
 * When active:  Bars animate with staggered sine-wave heights (golden).
 * When idle:    Bars shrink to minimum height (muted).
 *
 * Uses react-native-reanimated for 60fps worklet-based animation.
 * All animations run on the UI thread — zero JS thread load.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { duration as motionDuration } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceWaveformProps {
  /** Whether the waveform should animate. */
  readonly active: boolean;
  /** Number of bars to render (5–7). @default 7 */
  readonly barCount?: 5 | 6 | 7;
  /** Overall height of the waveform container in px. @default 40 */
  readonly height?: number;
  /** Bar color when active. @default colors.divine.aura (#FFD700) */
  readonly color?: string;
  /** Bar color when inactive. @default colors.text.muted (#7A7060) */
  readonly inactiveColor?: string;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BAR_WIDTH = 3;
const BAR_GAP = 4;
const BAR_RADIUS = 1.5;
const MIN_HEIGHT_FRACTION = 0.15; // 15% of container height when idle

/**
 * Phase offsets for each bar position — creates the organic wave shape.
 * Values are fractions of a full cycle (0-1).
 */
const PHASE_OFFSETS = [0, 0.4, 0.15, 0.6, 0.3, 0.75, 0.5];

/**
 * Amplitude multipliers — center bars taller, edges shorter.
 * Creates an arc-shaped envelope.
 */
const AMPLITUDE_MULTIPLIERS = [0.5, 0.7, 0.9, 1.0, 0.85, 0.65, 0.45];

// ---------------------------------------------------------------------------
// Single Animated Bar
// ---------------------------------------------------------------------------

interface WaveBarProps {
  readonly active: boolean;
  readonly index: number;
  readonly containerHeight: number;
  readonly color: string;
  readonly inactiveColor: string;
}

function WaveBar({
  active,
  index,
  containerHeight,
  color,
  inactiveColor,
}: WaveBarProps): React.JSX.Element {
  const progress = useSharedValue(0);
  const isActive = useSharedValue(active ? 1 : 0);
  const minH = containerHeight * MIN_HEIGHT_FRACTION;
  const maxH = containerHeight * (AMPLITUDE_MULTIPLIERS[index] ?? 0.7);
  const phase = PHASE_OFFSETS[index] ?? 0;

  // Sync JS active prop → shared value so the worklet reacts
  useEffect(() => {
    isActive.value = withTiming(active ? 1 : 0, {
      duration: motionDuration.fast,
    });
  }, [active, isActive]);

  useEffect(() => {
    if (active) {
      // Reset to phase offset start position
      progress.value = phase;

      // Animate 0→1 repeatedly (represents one sine cycle).
      // Each bar has a different starting phase for the wave effect.
      progress.value = withDelay(
        index * 80, // Stagger start by 80ms per bar
        withRepeat(
          withTiming(phase + 1, {
            duration: 800 + index * 60, // Slight frequency variation per bar
            easing: Easing.linear,
          }),
          -1, // Infinite repeat
          false,
        ),
      );
    } else {
      cancelAnimation(progress);
      // Animate back to rest position
      progress.value = withTiming(0, {
        duration: motionDuration.normal,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [active, progress, index, phase]);

  const animatedStyle = useAnimatedStyle(() => {
    const isOn = isActive.value > 0.5;
    // Use sine wave to drive height: sin(progress * 2π) maps to 0–1
    const sineValue = Math.sin(progress.value * Math.PI * 2);
    // Map sine (-1 to 1) → (0 to 1)
    const normalized = (sineValue + 1) / 2;
    // Map to height range
    const barHeight = isOn
      ? minH + normalized * (maxH - minH)
      : minH;

    return {
      height: barHeight,
      backgroundColor: isOn ? color : inactiveColor,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// VoiceWaveform
// ---------------------------------------------------------------------------

export function VoiceWaveform({
  active,
  barCount = 7,
  height = 40,
  color = colors.divine.aura,
  inactiveColor = colors.text.muted,
  testID,
}: VoiceWaveformProps): React.JSX.Element {
  return (
    <View
      style={[styles.container, { height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={active ? 'Recording in progress' : 'Voice recorder idle'}
      testID={testID}
    >
      {Array.from({ length: barCount }, (_, i) => (
        <WaveBar
          key={i}
          index={i}
          active={active}
          containerHeight={height}
          color={color}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_RADIUS,
  },
});
