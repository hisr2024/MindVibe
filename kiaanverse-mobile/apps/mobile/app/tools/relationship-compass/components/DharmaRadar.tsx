/**
 * DharmaRadar — the 8-axis radar chart that visualises the user's
 * relationship across Trust, Honesty, Respect, Growth, Freedom,
 * Compassion, Dharma, Union.
 *
 * Implementation:
 *   - Pure react-native-svg (no Skia dependency added).
 *   - Concentric guide circles + radial axis lines + filled polygon.
 *   - Endpoint dots are coloured by value (gold > teal > grey).
 *   - Centre om symbol is rendered as text.
 *   - The polygon fades in once on mount with a soft scale.
 *
 * The radar is fully driven by the `dharmaValues` map keyed by axis.id,
 * so the parent decides whether to show baseline (0.5) or live data.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { DHARMA_AXES } from '../data/dharmaAxes';
import type { GunaName } from '../hooks/useGunaCalculation';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const VIEWPORT = 300;
const CENTER = VIEWPORT / 2;
const MAX_R = 120;
const LABEL_OFFSET = 18;

/** Dominant guna → polygon stroke colour (matches the web). */
const GUNA_COLORS: Readonly<Record<GunaName, string>> = {
  tamas: '#3730A3',
  rajas: '#D97706',
  sattva: '#E8B54A',
  balanced: '#E8B54A',
};

/** Centre glyph for the dominant guna. */
const GUNA_GLYPH: Readonly<Record<GunaName, string>> = {
  tamas: 'त',
  rajas: 'र',
  sattva: 'स',
  balanced: 'ॐ',
};

export interface DharmaRadarProps {
  /** Axis id → value (0-1). */
  readonly dharmaValues: Readonly<Record<string, number>>;
  /** Dominant guna for stroke + glyph colour. */
  readonly dominantGuna: GunaName;
  /** Diameter of the rendered chart. @default 300 */
  readonly size?: number;
  /** Container style. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

/** polar (deg, radius) → cartesian SVG coords. 0° points up (north). */
function polarToCart(angleDeg: number, radius: number, scale: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER * scale + radius * scale * Math.cos(rad), CENTER * scale + radius * scale * Math.sin(rad)];
}

function DharmaRadarInner({
  dharmaValues,
  dominantGuna,
  size = VIEWPORT,
  style,
  testID,
}: DharmaRadarProps): React.JSX.Element {
  const scale = size / VIEWPORT;
  const polygonOpacity = useSharedValue(0);
  const polygonScale = useSharedValue(0);
  const dotOpacity = useSharedValue(0);

  useEffect(() => {
    polygonOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }),
    );
    polygonScale.value = withDelay(
      150,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    dotOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
  }, [polygonOpacity, polygonScale, dotOpacity, dharmaValues]);

  const points = useMemo(
    () =>
      DHARMA_AXES.map((axis) => {
        const value = dharmaValues[axis.id] ?? 0.5;
        const [x, y] = polarToCart(axis.angle, value * MAX_R, scale);
        return { axis, value, x, y };
      }),
    [dharmaValues, scale],
  );

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const polygonAnimProps = useAnimatedProps(() => ({
    opacity: polygonOpacity.value,
    transform: `scale(${polygonScale.value}) translate(${(1 - polygonScale.value) * CENTER * scale}, ${(1 - polygonScale.value) * CENTER * scale})`,
  }));

  const dotAnimProps = useAnimatedProps(() => ({ opacity: dotOpacity.value }));

  const gunaColor = GUNA_COLORS[dominantGuna] ?? GUNA_COLORS.balanced;
  const glyph = GUNA_GLYPH[dominantGuna] ?? GUNA_GLYPH.balanced;

  return (
    <View style={[{ width: size, height: size }, style]} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="dharmaFill" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={gunaColor} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={gunaColor} stopOpacity={0.08} />
          </RadialGradient>
        </Defs>

        {/* Concentric guide rings */}
        {[40, 80, 120].map((r) => (
          <Circle
            key={r}
            cx={CENTER * scale}
            cy={CENTER * scale}
            r={r * scale}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {DHARMA_AXES.map((axis) => {
          const [ex, ey] = polarToCart(axis.angle, MAX_R, scale);
          return (
            <Line
              key={axis.id}
              x1={CENTER * scale}
              y1={CENTER * scale}
              x2={ex}
              y2={ey}
              stroke="#FFFFFF"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <AnimatedPolygon
          animatedProps={polygonAnimProps}
          points={polygonPoints}
          fill="url(#dharmaFill)"
          stroke={gunaColor}
          strokeWidth={1.5}
        />

        {/* Endpoint dots + axis labels */}
        {points.map((p, i) => {
          const dotColor =
            p.value > 0.7 ? '#E8B54A' : p.value >= 0.4 ? '#0E7490' : '#4B5563';
          const [lx, ly] = polarToCart(p.axis.angle, MAX_R + LABEL_OFFSET, scale);
          return (
            <React.Fragment key={p.axis.id}>
              <AnimatedCircle
                animatedProps={dotAnimProps}
                cx={p.x}
                cy={p.y}
                r={4 * scale}
                fill={dotColor}
              />
              <SvgText
                x={lx}
                y={ly - 2}
                textAnchor="middle"
                fontSize={11 * scale}
                fontWeight="600"
                fill="#F5F0E8"
              >
                {p.axis.label}
              </SvgText>
              <SvgText
                x={lx}
                y={ly + 11 * scale}
                textAnchor="middle"
                fontSize={9 * scale}
                fontStyle="italic"
                fill="rgba(245, 240, 232, 0.55)"
              >
                {p.axis.sanskrit}
              </SvgText>
              {/* Anchor index used to keep React keys stable when values change */}
              {i === -1 ? null : null}
            </React.Fragment>
          );
        })}

        {/* Centre dominant-guna glyph */}
        <SvgText
          x={CENTER * scale}
          y={CENTER * scale + 10 * scale}
          textAnchor="middle"
          fontSize={28 * scale}
          fontWeight="600"
          fill={gunaColor}
        >
          {glyph}
        </SvgText>
      </Svg>
    </View>
  );
}

export const DharmaRadar = React.memo(DharmaRadarInner);

export default DharmaRadar;

export const dharmaRadarStyles = StyleSheet.create({
  centered: { alignSelf: 'center' },
});
