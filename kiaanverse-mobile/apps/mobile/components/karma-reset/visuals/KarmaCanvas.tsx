/**
 * KarmaCanvas — Phase-reactive sacred background.
 *
 * Two stacked Skia radial gradients sit over the cosmic void:
 *   - An ember glow at the bottom (karma's fire; always lit).
 *   - A phase-specific center glow that warms toward gold as the user
 *     progresses through the ritual.
 *
 * The gradient colors themselves are static per-phase. The "breath" of
 * the background is produced by animating the overlay's opacity on the
 * UI thread via Reanimated — this keeps the visual identity of each
 * phase crisp while giving the space the feel of slow breathing.
 *
 * Mirrors `app/(mobile)/m/karma-reset/visuals/KarmaCanvas.tsx`.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Canvas,
  Rect,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { KarmaResetPhase } from '../types';

interface KarmaCanvasProps {
  phase: KarmaResetPhase;
}

const PHASE_CONFIG: Record<
  KarmaResetPhase,
  { rgb: [number, number, number]; glow: number; ember: number }
> = {
  entry:      { rgb: [249, 115, 22],  glow: 0.04, ember: 0.04 },
  context:    { rgb: [212, 160, 23],  glow: 0.06, ember: 0.05 },
  reflection: { rgb: [27, 79, 187],   glow: 0.05, ember: 0.04 },
  wisdom:     { rgb: [212, 160, 23],  glow: 0.10, ember: 0.06 },
  sankalpa:   { rgb: [240, 192, 64],  glow: 0.12, ember: 0.08 },
  seal:       { rgb: [212, 160, 23],  glow: 0.15, ember: 0.10 },
};

function rgba(rgb: [number, number, number], alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
}

export function KarmaCanvas({ phase }: KarmaCanvasProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const config = PHASE_CONFIG[phase];

  // Slow "breath" — a 4s ease-in-out that modulates overall glow opacity.
  const breath = useSharedValue(0.6);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [breath]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  const emberCenter = useMemo(() => vec(width / 2, height), [width, height]);
  const glowCenter = useMemo(() => vec(width / 2, height * 0.4), [width, height]);
  const emberRadius = height * 0.5;
  const glowRadius = width * 0.5;

  const emberColors = useMemo(
    () => [rgba([249, 115, 22], config.ember), rgba([249, 115, 22], 0)],
    [config.ember],
  );
  const glowColors = useMemo(
    () => [rgba(config.rgb, config.glow), rgba(config.rgb, 0)],
    [config.glow, config.rgb],
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={emberCenter}
              r={emberRadius}
              colors={emberColors}
              positions={[0, 1]}
            />
          </Rect>
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient
              c={glowCenter}
              r={glowRadius}
              colors={glowColors}
              positions={[0, 1]}
            />
          </Rect>
        </Canvas>
      </Animated.View>
    </View>
  );
}
