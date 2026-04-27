/**
 * Shankha (शङ्ख) — Krishna's conch.
 *
 * Cinematic SVG fallback rendered until Part 11 ships the real Lottie
 * animations. Mounts the three sound-wave layers from
 * useShankhaAnimation (Reanimated worklets) so the visual hooks up to
 * actual ExoPlayer RMS metering.
 *
 * Per spec:
 *   • realistic conch shell — never flat cartoon
 *   • cream/ivory body, warm copper rim
 *   • three-quarter angle with mouth slightly visible
 *   • optional Om / Sri marking only if legible at 24dp
 *   • cinematic, realistic, divine
 *
 * The SVG path here is a stylized conch silhouette. Production will
 * swap it for the full asset bundle in Part 11.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import {
  useShankhaAnimation,
  type ShankhaWaveLayer,
} from '../hooks/useShankhaAnimation';
import { Color } from '../lib/theme';

interface ShankhaProps {
  size?: number;
}

export function Shankha({ size = 220 }: ShankhaProps) {
  const { state, waveLayers } = useShankhaAnimation();
  const showWaves = state === 'speaking' || state === 'listening';
  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {showWaves
        ? waveLayers.map((layer, i) => (
            <SoundWaveLayer key={i} layer={layer} size={size} />
          ))
        : null}
      <View style={styles.shellWrap} pointerEvents="none">
        <ShankhaSvg size={size} />
      </View>
    </View>
  );
}

function SoundWaveLayer({ layer, size }: { layer: ShankhaWaveLayer; size: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: layer.scale.value }],
    opacity: layer.opacity.value,
  }));
  return (
    <Animated.View
      style={[
        styles.waveLayer,
        animatedStyle,
        { width: size * 1.7, height: size * 1.7, borderRadius: (size * 1.7) / 2 },
      ]}
    />
  );
}

function ShankhaSvg({ size }: { size: number }) {
  // Stylized three-quarter conch silhouette. Two gradients give the
  // ivory body a soft realistic gradient + the copper rim accent. The
  // path is intentionally hand-tuned (not auto-traced) so the shape
  // reads as a conch even at 24dp.
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="body" cx="50%" cy="45%" r="55%">
          <Stop offset="0%" stopColor={Color.shankhaCream} stopOpacity="1" />
          <Stop offset="60%" stopColor={Color.shankhaIvory} stopOpacity="1" />
          <Stop offset="100%" stopColor={Color.shankhaCopper} stopOpacity="0.6" />
        </RadialGradient>
        <LinearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Color.divineGoldBright} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={Color.shankhaCopper} stopOpacity="0.65" />
        </LinearGradient>
      </Defs>
      {/* Conch body — spiral with widening mouth */}
      <Path
        d="M 100 30
           C 60 38, 40 75, 50 115
           C 56 145, 80 165, 110 168
           C 138 170, 158 156, 160 130
           C 162 110, 148 96, 130 92
           C 116 90, 105 100, 108 115
           C 110 125, 122 130, 130 122
           Z"
        fill="url(#body)"
        stroke="url(#rim)"
        strokeWidth="2"
      />
      {/* Inner spiral suggestion */}
      <Path
        d="M 100 70
           C 80 78, 72 100, 80 118
           C 86 130, 100 134, 110 128"
        fill="none"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
      {/* Mouth highlight (where sound emerges) */}
      <Path
        d="M 145 132
           C 152 132, 156 138, 152 144
           C 148 148, 142 146, 142 140 Z"
        fill={Color.divineGoldDim}
        opacity="0.8"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shellWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLayer: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: Color.divineGold,
    backgroundColor: 'transparent',
  },
});
