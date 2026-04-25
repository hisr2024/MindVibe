/**
 * DharmaFlameIcon — Animated flame rendered with Skia.
 *
 * The flame is the Gita's metaphor for karma: action that illuminates.
 * Used across phases to represent karmic weight. The shape matches the
 * web SVG path, but the flicker is a subtle non-uniform scale driven
 * by a Reanimated shared value so it stays on the UI thread.
 *
 * Mirrors `app/(mobile)/m/karma-reset/visuals/DharmaFlameIcon.tsx`.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Group,
  Path,
  Skia,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type FlameIntensity = 'dim' | 'normal' | 'bright';

interface DharmaFlameIconProps {
  size?: number;
  intensity?: FlameIntensity;
  color?: string;
  animate?: boolean;
}

const OPACITY_MAP: Record<FlameIntensity, number> = {
  dim: 0.35,
  normal: 0.85,
  bright: 1.0,
};

// Flame outline (48×64 art space, origin top-left), taken from the web SVG
const FLAME_OUTER =
  'M24 62 C12 62 4 52 4 40 C4 28 14 20 18 12 C20 8 20 4 24 2 C24 2 26 10 28 14 C32 22 44 30 44 42 C44 54 36 62 24 62Z';
const FLAME_INNER =
  'M24 58 C18 58 14 52 14 46 C14 40 18 36 20 30 C22 34 28 38 28 46 C28 52 26 58 24 58Z';

export function DharmaFlameIcon({
  size = 24,
  intensity = 'normal',
  color = '#D4A017',
  animate = true,
}: DharmaFlameIconProps): React.JSX.Element {
  const opacity = OPACITY_MAP[intensity];

  // Flicker phase progresses 0 → 1 → 0 repeatedly
  const flicker = useSharedValue(0);

  useEffect(() => {
    if (animate) {
      flicker.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      flicker.value = 0;
    }
  }, [animate, flicker]);

  // Non-uniform scale around the bottom-center (matches web keyframes)
  const transform = useDerivedValue(() => {
    const t = flicker.value;
    const scaleX = 1 + (t < 0.5 ? -0.05 * (t * 2) : 0.03 * ((t - 0.5) * 2));
    const scaleY = 1 + (t < 0.5 ? 0.04 * (t * 2) : -0.03 * ((t - 0.5) * 2));
    return [{ scaleX }, { scaleY }];
  }, [flicker]);

  const canvasWidth = size;
  const canvasHeight = size * 1.33;
  const scale = size / 48;

  const outerPath = Skia.Path.MakeFromSVGString(FLAME_OUTER);
  const innerPath = Skia.Path.MakeFromSVGString(FLAME_INNER);

  if (!outerPath || !innerPath) {
    // Skia's Canvas type requires children; an empty fallback canvas
    // would also waste a GPU surface. A plain View is the right
    // placeholder when the SVG paths fail to parse.
    return <View style={{ width: canvasWidth, height: canvasHeight }} />;
  }

  const originX = canvasWidth / 2;
  const originY = canvasHeight; // bottom-center pivot for the flicker

  return (
    <Canvas style={{ width: canvasWidth, height: canvasHeight, opacity }}>
      <Group transform={transform} origin={vec(originX, originY)}>
        <Group transform={[{ scale }]}>
          {/* Main flame body — radial gradient from bottom-center */}
          <Path path={outerPath}>
            <RadialGradient
              c={vec(24, 51)}
              r={29}
              colors={['#FDE68A', color, '#92400E', '#05071400']}
              positions={[0, 0.35, 0.7, 1]}
            />
          </Path>
          {/* Inner bright core */}
          <Path path={innerPath} color="rgba(253,230,138,0.5)" />
        </Group>
      </Group>
    </Canvas>
  );
}
