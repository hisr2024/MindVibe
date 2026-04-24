/**
 * KarmaSealMandala — 12-petal mandala for the Seal phase.
 *
 * Saffron + gold alternating petals around a slow-rotating Dharma
 * wheel (ॐ) center. Saffron = karma's fire that purifies, gold =
 * wisdom that remains. Each petal fades in on a stagger for the
 * completion ceremony; the whole mandala springs in from scale 0.
 *
 * Mirrors `app/(mobile)/m/karma-reset/visuals/KarmaSealMandala.tsx`.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  RadialGradient as SvgRadialGradient,
  Stop,
  Ellipse,
  G,
} from 'react-native-svg';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface KarmaSealMandalaProps {
  size?: number;
}

const PETAL_COUNT = 12;

interface PetalProps {
  index: number;
  petalWidth: number;
  petalLength: number;
  isGold: boolean;
}

function Petal({
  index,
  petalWidth,
  petalLength,
  isGold,
}: PetalProps): React.JSX.Element {
  const progress = useSharedValue(0);
  const angle = (360 / PETAL_COUNT) * index;

  useEffect(() => {
    progress.value = withDelay(
      300 + index * 50,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );
  }, [progress, index]);

  // react-native-svg reads `opacity` and `transform` from animatedProps
  const animatedProps = useAnimatedProps(() => ({
    opacity: progress.value,
    transform: `rotate(${angle}) scale(${progress.value})`,
  }));

  return (
    <AnimatedEllipse
      cx={0}
      cy={-petalLength / 2 - 8}
      rx={petalWidth / 2}
      ry={petalLength / 2}
      fill={isGold ? 'url(#petal-gold)' : 'url(#petal-saffron)'}
      animatedProps={animatedProps}
    />
  );
}

export function KarmaSealMandala({
  size = 200,
}: KarmaSealMandalaProps): React.JSX.Element {
  const outerRadius = size / 2;
  const petalLength = outerRadius * 0.7;
  const petalWidth = outerRadius * 0.22;

  // Mandala entrance: spring from scale 0 → 1
  const mandalaScale = useSharedValue(0);
  const mandalaOpacity = useSharedValue(0);

  // Center wheel: continuous slow rotation
  const wheelRotation = useSharedValue(0);

  useEffect(() => {
    mandalaOpacity.value = withTiming(1, { duration: 600 });
    mandalaScale.value = withSpring(1, { damping: 18, stiffness: 120 });
    wheelRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, [mandalaOpacity, mandalaScale, wheelRotation]);

  const mandalaStyle = useAnimatedStyle(() => ({
    opacity: mandalaOpacity.value,
    transform: [{ scale: mandalaScale.value }],
  }));

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wheelRotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, mandalaStyle]}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgRadialGradient id="petal-gold" cx="50%" cy="100%" r="80%">
            <Stop offset="0%" stopColor="#FDE68A" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#D4A017" stopOpacity={0.6} />
          </SvgRadialGradient>
          <SvgRadialGradient id="petal-saffron" cx="50%" cy="100%" r="80%">
            <Stop offset="0%" stopColor="#FB923C" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#F97316" stopOpacity={0.6} />
          </SvgRadialGradient>
        </Defs>
        <G transform={`translate(${outerRadius}, ${outerRadius})`}>
          {Array.from({ length: PETAL_COUNT }).map((_, i) => (
            <Petal
              key={i}
              index={i}
              petalWidth={petalWidth}
              petalLength={petalLength}
              isGold={i % 2 === 0}
            />
          ))}
        </G>
      </Svg>

      {/* Center Dharma wheel — slow rotation */}
      <Animated.View
        style={[
          styles.wheel,
          {
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: (size * 0.22) / 2,
            top: size / 2 - (size * 0.22) / 2,
            left: size / 2 - (size * 0.22) / 2,
          },
          wheelStyle,
        ]}
      >
        <Text style={[styles.om, { fontSize: size * 0.09 }]}>ॐ</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  om: {
    color: '#F0C040',
    fontStyle: 'italic',
    fontWeight: '300',
  },
});
