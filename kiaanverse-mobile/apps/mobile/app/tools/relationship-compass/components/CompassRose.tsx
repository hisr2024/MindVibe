/**
 * CompassRose — animated 8-petal sacred compass.
 *
 * Used as the title-glyph on the Altar (large) and Seal (medium) chambers.
 * Petals stagger-bloom outward, the centre dot finishes after them with a
 * gentle bounce. Pure SVG — no images, no Skia required.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const PETAL_COLOR = '#E8B54A';

export interface CompassRoseProps {
  /** Diameter of the rendered rose in points. @default 120 */
  readonly size?: number;
  /** Container style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

/** A single animated petal at a fixed angle. */
function Petal({
  angle,
  index,
  size,
}: {
  readonly angle: number;
  readonly index: number;
  readonly size: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 80,
      withSpring(1, { damping: 12, stiffness: 120 })
    );
    opacity.value = withDelay(
      index * 80,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
    );
  }, [scale, opacity, index]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: `rotate(${angle} ${size / 2} ${size / 2}) scale(${scale.value})`,
  }));

  return (
    <AnimatedEllipse
      animatedProps={animatedProps}
      cx={size / 2}
      cy={size * 0.23}
      rx={size * 0.067}
      ry={size * 0.23}
      fill={PETAL_COLOR}
      fillOpacity={0.7}
      // Initial transform so petals start at centre (scale 0)
      transform={`rotate(${angle} ${size / 2} ${size / 2})`}
    />
  );
}

function CompassRoseInner({
  size = 120,
  style,
  testID,
}: CompassRoseProps): React.JSX.Element {
  const centerScale = useSharedValue(0);

  useEffect(() => {
    centerScale.value = withDelay(
      PETAL_ANGLES.length * 80,
      withSpring(1, { damping: 8, stiffness: 160 })
    );
  }, [centerScale]);

  const centerProps = useAnimatedProps(() => ({
    r: size * 0.05 * centerScale.value,
  }));

  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {PETAL_ANGLES.map((angle, i) => (
            <Petal key={angle} angle={angle} index={i} size={size} />
          ))}
        </G>
        <AnimatedCircle
          animatedProps={centerProps}
          cx={size / 2}
          cy={size / 2}
          fill={PETAL_COLOR}
        />
      </Svg>
    </View>
  );
}

export const CompassRose = React.memo(CompassRoseInner);

export default CompassRose;

// Re-export style for callers that want to centre the rose horizontally.
export const compassRoseCentered = StyleSheet.create({
  centered: { alignSelf: 'center' },
}).centered;
