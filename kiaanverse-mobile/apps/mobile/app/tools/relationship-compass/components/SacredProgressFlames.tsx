/**
 * SacredProgressFlames — the row of 6 lotus icons at the top of every
 * compass chamber that lights up as the user advances.
 *
 * Visual contract (matches the screenshots):
 *   - Total icons = `total` (default 6, the number of chambers).
 *   - Icons before `current` glow gold.
 *   - The icon at index `current` is wrapped in a thin gold square
 *     (the "you are here" frame) and pulses gently.
 *   - Icons after `current` are dim outlines.
 *   - Spacing is tight (12 px) so the row stays compact under the
 *     screen header.
 *
 * Pure presentational component — accepts only the two indices.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const GOLD_BRIGHT = '#E8B54A';
const GOLD_DIM = 'rgba(232, 181, 74, 0.32)';
const GOLD_FRAME = 'rgba(232, 181, 74, 0.85)';
const FRAME_BG = 'rgba(232, 181, 74, 0.12)';

const ICON_SIZE = 22;
const FRAME_PADDING = 4;

export interface SacredProgressFlamesProps {
  /** Total number of chambers (icons). Defaults to 6. */
  readonly total?: number;
  /** Zero-indexed current chamber. */
  readonly current: number;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

/**
 * Stylised lotus diya — a small SVG that we tint with the prop colour.
 * Drawn as three flame-shaped petals so it reads as a single lit lamp.
 */
function LotusFlame({ color, size }: { readonly color: string; readonly size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 28">
      {/* Centre flame */}
      <Path
        d="M12 2 C 14 8 14 12 12 18 C 10 12 10 8 12 2 Z"
        fill={color}
      />
      {/* Left petal */}
      <Path
        d="M5 9 C 8 12 9 16 12 20 C 9 18 6 16 4 13 C 4 11 4 10 5 9 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Right petal */}
      <Path
        d="M19 9 C 16 12 15 16 12 20 C 15 18 18 16 20 13 C 20 11 20 10 19 9 Z"
        fill={color}
        opacity={0.85}
      />
      {/* Base */}
      <Path
        d="M5 21 H19 L17 26 H7 Z"
        fill={color}
        opacity={0.55}
      />
    </Svg>
  );
}

/** The wrapper that pulses the active flame. */
function ActiveFlame({ size }: { readonly size: number }): React.JSX.Element {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          padding: FRAME_PADDING,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: GOLD_FRAME,
          backgroundColor: FRAME_BG,
        },
        animatedStyle,
      ]}
    >
      <LotusFlame color={GOLD_BRIGHT} size={size} />
    </Animated.View>
  );
}

function SacredProgressFlamesInner({
  total = 6,
  current,
  style,
  testID,
}: SacredProgressFlamesProps): React.JSX.Element {
  const indices = Array.from({ length: total }, (_, i) => i);

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total - 1, now: current }}
      accessibilityLabel={`Step ${current + 1} of ${total}`}
      testID={testID}
    >
      {indices.map((i) => {
        if (i === current) {
          return (
            <View key={i} style={styles.cell}>
              <ActiveFlame size={ICON_SIZE} />
            </View>
          );
        }
        const color = i < current ? GOLD_BRIGHT : GOLD_DIM;
        return (
          <View key={i} style={[styles.cell, styles.unframed]}>
            <LotusFlame color={color} size={ICON_SIZE} />
          </View>
        );
      })}
    </View>
  );
}

export const SacredProgressFlames = React.memo(SacredProgressFlamesInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unframed: {
    // Inactive icons sit at the same vertical centre as the framed one.
    paddingVertical: FRAME_PADDING + 1,
  },
});

export default SacredProgressFlames;
