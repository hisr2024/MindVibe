/**
 * LotusProgressHeader — the six-petal progress crown for Nitya Sadhana.
 *
 * Renders six lotus-petal motifs laid out as the progress crown for the
 * daily ceremony. A completed petal blooms to its full gold form; the
 * active petal pulses gently; remaining petals sit as faint outlines.
 *
 * Visually this is a sibling of the web SacredStepIndicator but with
 * lotus-shaped petal marks in place of plain circles — a reminder that
 * each phase is a petal of the day's sankalpa, not a checkbox.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212,160,23,0.4)';
const TEXT_MUTED = 'rgba(240,235,225,0.5)';
const PETAL_SIZE = 28;

export interface LotusProgressHeaderProps {
  /** Total petals (always 6 for Nitya Sadhana). */
  readonly total: number;
  /** Zero-indexed active step. */
  readonly current: number;
  /** Zero-indexed set of completed steps. */
  readonly completed: ReadonlySet<number>;
  /** Optional outer style override. */
  readonly style?: ViewStyle;
  /** Optional accessibility label override. */
  readonly label?: string;
}

function LotusProgressHeaderInner({
  total,
  current,
  completed,
  style,
  label,
}: LotusProgressHeaderProps): React.JSX.Element {
  const indices = React.useMemo(
    () => Array.from({ length: total }, (_, i) => i),
    [total]
  );

  const completedCount = completed.size;

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? `Phase ${current + 1} of ${total}`}
      accessibilityValue={{ now: completedCount, min: 0, max: total }}
    >
      {indices.map((i) => {
        const isCompleted = completed.has(i);
        const isActive = i === current && !isCompleted;
        return (
          <Petal
            key={i}
            index={i}
            isCompleted={isCompleted}
            isActive={isActive}
            totalPetals={total}
          />
        );
      })}

      <View style={styles.labelWrap}>
        <Text style={styles.label} allowFontScaling={false}>
          {completedCount} of {total}
        </Text>
      </View>
    </View>
  );
}

interface PetalProps {
  readonly index: number;
  readonly isCompleted: boolean;
  readonly isActive: boolean;
  readonly totalPetals: number;
}

function Petal({
  index,
  isCompleted,
  isActive,
  totalPetals,
}: PetalProps): React.JSX.Element {
  const pulse = useSharedValue(0);
  const bloom = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    bloom.value = withTiming(isCompleted ? 1 : 0, {
      duration: 600,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // lotus-bloom
    });
  }, [isCompleted, bloom]);

  useEffect(() => {
    if (!isActive) {
      pulse.value = withTiming(0, { duration: 220 });
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [isActive, pulse]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + bloom.value * 0.12 + pulse.value * 0.08 }],
    opacity: isCompleted ? 1 : isActive ? 0.65 + pulse.value * 0.35 : 0.35,
  }));

  const id = `petalGrad-${index}-${totalPetals}`;
  const fill = isCompleted ? `url(#${id})` : 'transparent';
  const stroke = isCompleted ? GOLD : isActive ? GOLD : GOLD_SOFT;

  return (
    <Animated.View style={[styles.petalWrap, style]}>
      <Svg width={PETAL_SIZE} height={PETAL_SIZE} viewBox="0 0 28 28">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F0C040" stopOpacity="1" />
            <Stop offset="1" stopColor="#8B6914" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* A single stylised lotus petal — narrow base, rounded top. */}
        <Path
          d="M14 2 C 6 8, 6 18, 14 26 C 22 18, 22 8, 14 2 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

/** Six-petal lotus progress crown. */
export const LotusProgressHeader = React.memo(LotusProgressHeaderInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  petalWrap: {
    width: PETAL_SIZE,
    height: PETAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    marginLeft: 10,
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.2,
  },
});
