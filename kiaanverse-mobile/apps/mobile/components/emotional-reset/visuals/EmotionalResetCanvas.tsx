/**
 * EmotionalResetCanvas — Phase-reactive cosmic backdrop.
 *
 * Mirrors the web version's `radial-gradient(ellipse at 50% 40%, #0A0D28 0%,
 * #050714 70%)` plus a phase-tinted soft glow. Skia's `RadialGradient` runs
 * on the GPU, and the gentle breath animation stays on the UI thread via
 * Reanimated, so the ritual's "held space" feels alive without costing
 * jank.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { EmotionalResetPhase } from '../types';

interface EmotionalResetCanvasProps {
  phase: EmotionalResetPhase;
  /** Phase-specific glow tint; defaults to divine gold. */
  tint?: string;
}

const PHASE_ALPHA: Record<EmotionalResetPhase, number> = {
  arrival: 0.04,
  mandala: 0.06,
  witness: 0.08,
  breath: 0.05,
  integration: 0.08,
  ceremony: 0.14,
};

function toRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

export function EmotionalResetCanvas({
  phase,
  tint = '#D4A017',
}: EmotionalResetCanvasProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // Slow breath on the glow layer (4s ease-in-out).
  const breath = useSharedValue(0.65);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1.0, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [breath]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: breath.value }));

  const glowCenter = useMemo(
    () => vec(width / 2, height * 0.4),
    [width, height]
  );
  const glowRadius = Math.max(width, height) * 0.6;

  const glowColors = useMemo(
    () => [toRgba(tint, PHASE_ALPHA[phase]), toRgba(tint, 0)],
    [tint, phase]
  );

  const voidCenter = useMemo(
    () => vec(width / 2, height * 0.4),
    [width, height]
  );
  const voidRadius = Math.max(width, height) * 0.9;
  const voidColors = useMemo(() => ['rgba(10,13,40,1)', 'rgba(5,7,20,1)'], []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Cosmic void (static) */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient c={voidCenter} r={voidRadius} colors={voidColors} />
        </Rect>
      </Canvas>
      {/* Phase glow (breathing) */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={width} height={height}>
            <RadialGradient c={glowCenter} r={glowRadius} colors={glowColors} />
          </Rect>
        </Canvas>
      </Animated.View>
    </View>
  );
}
