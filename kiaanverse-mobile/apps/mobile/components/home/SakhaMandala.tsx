/**
 * SakhaMandala — small rotating sacred mandala used on the Home quick-access card.
 *
 * Always spinning (even after mount) at 12s per revolution. When `active`
 * is true the mandala rings brighten and a subtle golden halo appears.
 * Built with react-native-svg + Reanimated; no Skia required.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface SakhaMandalaProps {
  readonly size?: number | undefined;
  readonly active?: boolean | undefined;
  readonly style?: ViewStyle | undefined;
}

export function SakhaMandala({
  size = 56,
  active = false,
  style,
}: SakhaMandalaProps): React.JSX.Element {
  const rotation = useSharedValue(0);
  const glow = useSharedValue(active ? 1 : 0.55);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 12_000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  useEffect(() => {
    glow.value = withTiming(active ? 1 : 0.55, { duration: 400 });
  }, [active, glow]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const haloStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.6 }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const midR = outerR * 0.7;
  const innerR = outerR * 0.4;
  const color = '#D4A017';

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.halo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          haloStyle,
        ]}
      />
      <Animated.View style={spinStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            stroke={color}
            strokeWidth={1.25}
            fill="none"
            opacity={0.55}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={midR}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={0.4}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            stroke={color}
            strokeWidth={1}
            fill="none"
            opacity={0.55}
          />
          <Circle cx={cx} cy={cy} r={2.5} fill={color} opacity={0.9} />
          {/* eight petals connecting innerR → midR */}
          {Array.from({ length: 8 }, (_, i) => {
            const a1 = (i / 8) * Math.PI * 2;
            const a2 = a1 + Math.PI / 8;
            const x1 = cx + innerR * Math.cos(a1);
            const y1 = cy + innerR * Math.sin(a1);
            const x2 = cx + midR * Math.cos(a2);
            const y2 = cy + midR * Math.sin(a2);
            return (
              <Path
                key={`petal-${i}`}
                d={`M${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                stroke={color}
                strokeWidth={0.9}
                fill="none"
                opacity={0.4}
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(212, 160, 23, 0.14)',
    shadowColor: '#D4A017',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
