/**
 * Shankha (शङ्ख) — clean silhouette per founder reference.
 *
 * Simple, divine, unambiguous: a solid golden conch silhouette with
 * a peacock feather rising from the spiral apex. No gradients, no
 * decorative bands — minimal black-silhouette-style design matching
 * the reference image, rendered in divine gold so it reads on the
 * dark cosmic-void canvas.
 *
 * Mounts the three sound-wave layers from useShankhaAnimation
 * (Reanimated worklets) so the visual hooks up to actual ExoPlayer
 * RMS metering during ``speaking`` / ``listening`` states.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
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

/**
 * Simple silhouette Shankha — single solid fill, no gradients, no
 * decorative bands. Three SVG paths only:
 *
 *   1. Peacock feather rising from the spiral apex
 *   2. Conch body — the main silhouette (solid fill)
 *   3. Spiral stripes — a few horizontal ridges at the apex
 *
 * viewBox 200×280 (taller than wide) so the peacock feather has
 * vertical room above the conch.
 */
function ShankhaSvg({ size }: { size: number }) {
  const fill = Color.divineGoldBright;
  return (
    <Svg width={size} height={size * 1.4} viewBox="0 0 200 280">
      {/* ── Peacock feather — rises from the spiral apex ──
          Single stem with a teardrop eye at the tip. Minimal,
          recognizable, matching the reference. */}
      <Path
        d="M 92 110
           Q 88 90, 82 70
           Q 76 50, 72 30"
        fill="none"
        stroke={fill}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Feather barbs — short strokes along the stem */}
      {[
        { x1: 90, y1: 100, x2: 84, y2: 96 },
        { x1: 88, y1: 90, x2: 94, y2: 86 },
        { x1: 86, y1: 80, x2: 80, y2: 76 },
        { x1: 84, y1: 70, x2: 90, y2: 66 },
        { x1: 80, y1: 60, x2: 74, y2: 56 },
        { x1: 78, y1: 50, x2: 84, y2: 46 },
        { x1: 76, y1: 40, x2: 70, y2: 36 },
      ].map((b, i) => (
        <Path
          key={`barb-${i}`}
          d={`M ${b.x1} ${b.y1} L ${b.x2} ${b.y2}`}
          stroke={fill}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
      {/* Peacock feather eye — solid teardrop shape at the tip */}
      <Ellipse cx="72" cy="28" rx="10" ry="14" fill={fill} />
      {/* Eye dark center */}
      <Ellipse cx="72" cy="28" rx="4" ry="6" fill="#1A1010" opacity="0.85" />
      <Circle cx="72" cy="25" r="1.5" fill={fill} />

      {/* ── Spiral apex — short stack of horizontal ridges ──
          Three small bumps at the top of the conch where the spiral
          coils. Matches the reference's stepped spiral. */}
      <Path
        d="M 95 130
           L 110 130
           Q 115 124, 110 118
           L 96 118
           Q 91 124, 95 130 Z"
        fill={fill}
      />
      <Path
        d="M 96 118
           L 108 118
           Q 113 113, 108 108
           L 97 108
           Q 92 113, 96 118 Z"
        fill={fill}
      />
      <Path
        d="M 98 108
           L 106 108
           Q 110 104, 106 100
           L 99 100
           Q 95 104, 98 108 Z"
        fill={fill}
      />

      {/* ── Conch body — single solid silhouette ──
          The main conch shape: spiral apex at top-center, body
          curving down and to the right, mouth opening flared at
          the bottom. Matches the silhouette of the reference image
          (image 2). */}
      <Path
        d="M 92 130
           C 70 140, 55 165, 55 200
           C 55 235, 78 265, 115 270
           C 150 273, 178 258, 178 230
           C 178 220, 172 215, 165 218
           L 175 240
           Q 178 250, 170 252
           Q 158 254, 150 246
           L 138 232
           C 130 220, 130 205, 138 198
           C 145 192, 158 190, 162 184
           C 165 178, 162 170, 155 168
           C 145 165, 130 168, 120 175
           C 110 182, 105 192, 108 200
           Q 110 208, 118 210
           Q 128 212, 132 206
           L 126 200
           Q 122 198, 118 200
           L 110 195
           C 105 190, 105 180, 110 175
           C 116 170, 120 162, 118 155
           C 116 148, 110 142, 105 138
           C 100 134, 95 132, 92 130 Z"
        fill={fill}
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
