/**
 * Shankha (शङ्ख) — Krishna's conch.
 *
 * Cinematic SVG: ornate golden body with Indian decorative bands,
 * spiral top, dark copper interior at the mouth, and a peacock feather
 * emerging from the spiral (Krishna's iconic motif).
 *
 * Per founder reference: should look divine and ornate — never flat
 * cartoon. Multiple decorative bands across the body, gradient golden
 * surface, dark copper interior visible at the opening, peacock
 * feather as the divine accent.
 *
 * Mounts the three sound-wave layers from useShankhaAnimation
 * (Reanimated worklets) so the visual hooks up to actual ExoPlayer
 * RMS metering during ``speaking`` / ``listening`` states.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
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
 * Ornate divine Shankha with peacock feather. Layered SVG paths build
 * up the ornament:
 *   1. Body silhouette  — gradient gold→copper conch shape
 *   2. Decorative bands — 3 horizontal bands across the body
 *   3. Inner mouth      — dark copper-brown opening at the bottom
 *   4. Spiral top       — concentric rings forming the apex
 *   5. Rim highlight    — bright gold edge accent
 *   6. Peacock feather  — divine motif emerging from the spiral
 *
 * viewBox is 200×260 (taller than wide) so the peacock feather
 * has vertical room above the conch.
 */
function ShankhaSvg({ size }: { size: number }) {
  return (
    // viewBox shifted so the conch BODY centers vertically (the peacock
    // feather extends above the natural center). Height ratio 1.25 :1
    // keeps the feather room without squashing the body.
    <Svg width={size} height={size * 1.25} viewBox="0 0 200 250">
      <Defs>
        {/* Body gradient — golden ivory in the center, deeper copper
            toward the edges. Mimics the reference's metallic sheen. */}
        <RadialGradient id="body" cx="42%" cy="55%" r="60%">
          <Stop offset="0%" stopColor={Color.divineGoldBright} stopOpacity="1" />
          <Stop offset="35%" stopColor={Color.shankhaCream} stopOpacity="1" />
          <Stop offset="75%" stopColor={Color.divineGold} stopOpacity="1" />
          <Stop offset="100%" stopColor={Color.shankhaCopper} stopOpacity="1" />
        </RadialGradient>

        {/* Rim gradient — bright gold-to-amber for the edges and
            spiral coils so they read as raised metalwork. */}
        <LinearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={Color.divineGoldBright} stopOpacity="1" />
          <Stop offset="50%" stopColor={Color.divineGold} stopOpacity="1" />
          <Stop offset="100%" stopColor={Color.shankhaCopper} stopOpacity="1" />
        </LinearGradient>

        {/* Mouth gradient — deep copper-brown at the conch opening,
            so the dark interior shows through as in the reference. */}
        <RadialGradient id="mouth" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#3D2010" stopOpacity="1" />
          <Stop offset="60%" stopColor={Color.shankhaCopper} stopOpacity="1" />
          <Stop offset="100%" stopColor={Color.divineGold} stopOpacity="0.85" />
        </RadialGradient>

        {/* Peacock-feather eye gradient — emerald to indigo to gold,
            traditional peacock-feather palette. */}
        <RadialGradient id="featherEye" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#7A4A1A" stopOpacity="1" />
          <Stop offset="35%" stopColor="#1B5C2F" stopOpacity="1" />
          <Stop offset="70%" stopColor="#1E3A8A" stopOpacity="1" />
          <Stop offset="100%" stopColor={Color.divineGoldBright} stopOpacity="0.95" />
        </RadialGradient>
      </Defs>

      {/* ── Peacock feather — emerges from the spiral apex ──
          A subtle divine accent inspired by Krishna's iconography.
          The plume curves up and to the right; the eye sits at the tip. */}
      <Path
        d="M 110 90
           Q 118 70, 128 50
           Q 138 28, 145 12
           Q 142 30, 138 50
           Q 135 70, 128 92
           Z"
        fill={Color.divineGold}
        opacity="0.85"
      />
      <Path
        d="M 110 90
           Q 118 70, 128 50
           Q 138 28, 145 12"
        fill="none"
        stroke={Color.shankhaCopper}
        strokeWidth="0.8"
        strokeOpacity="0.9"
      />
      {/* Feather barbules — short strokes radiating from the central rachis */}
      {Array.from({ length: 12 }).map((_, i) => {
        const t = i / 12;
        const x1 = 110 + (145 - 110) * t + 6 * Math.sin(t * 3);
        const y1 = 90 + (12 - 90) * t;
        const angle = -55 + t * 30;
        const len = 6 + t * 4;
        const x2 = x1 + Math.cos((angle * Math.PI) / 180) * len;
        const y2 = y1 + Math.sin((angle * Math.PI) / 180) * len;
        return (
          <Path
            key={`barb-${i}`}
            d={`M ${x1} ${y1} L ${x2} ${y2}`}
            stroke={Color.divineGoldBright}
            strokeWidth="0.6"
            strokeOpacity="0.7"
          />
        );
      })}
      {/* Peacock feather eye */}
      <Ellipse cx="143" cy="14" rx="7" ry="9" fill="url(#featherEye)" />
      <Ellipse cx="143" cy="14" rx="3" ry="4" fill="#0B1A4D" opacity="0.9" />
      <Circle cx="143" cy="13" r="1.2" fill={Color.divineGoldBright} />

      {/* ── Conch body — main silhouette ──
          Wider at the bottom, tapering to the spiral apex at the top.
          The path traces the outline visible in the reference image:
          spiral peak top-right, body curving down-left, opening at
          the bottom with the lip visible. */}
      <Path
        d="M 110 95
           C 75 100, 55 130, 50 160
           C 46 185, 55 215, 80 235
           C 105 250, 145 248, 168 230
           C 188 215, 195 195, 188 175
           C 182 158, 165 150, 148 156
           C 132 162, 124 175, 130 188
           C 134 198, 148 200, 156 192
           C 160 188, 162 184, 162 180"
        fill="url(#body)"
        stroke="url(#rim)"
        strokeWidth="2"
      />

      {/* ── Inner spiral coil — visible inside the upper body ──
          Three concentric arcs suggesting the conch's internal
          chambers spiraling toward the apex. */}
      <Path
        d="M 130 130
           C 116 134, 108 148, 114 162
           C 120 174, 134 178, 144 172"
        fill="none"
        stroke={Color.shankhaCopper}
        strokeWidth="1.2"
        strokeOpacity="0.75"
      />
      <Path
        d="M 138 138
           C 128 142, 124 152, 128 162
           C 132 170, 142 172, 148 168"
        fill="none"
        stroke={Color.shankhaCopper}
        strokeWidth="1"
        strokeOpacity="0.6"
      />

      {/* ── Spiral apex — concentric rings forming the conch's top ──
          Tightly stacked elliptical rings that read as a coiled
          spiral viewed from the side. */}
      {[
        { cy: 102, rx: 10, ry: 6 },
        { cy: 96,  rx: 9,  ry: 5 },
        { cy: 91,  rx: 8,  ry: 4.5 },
        { cy: 86,  rx: 7,  ry: 4 },
        { cy: 81,  rx: 6,  ry: 3.5 },
        { cy: 77,  rx: 5,  ry: 3 },
      ].map((r, i) => (
        <Ellipse
          key={`spiral-${i}`}
          cx={114 - i * 0.5}
          cy={r.cy}
          rx={r.rx}
          ry={r.ry}
          fill="url(#rim)"
          stroke={Color.shankhaCopper}
          strokeWidth="0.7"
          strokeOpacity="0.85"
        />
      ))}

      {/* ── Decorative bands — three horizontal bands of Indian
          ornament across the body. The reference image shows
          intricate engraved motifs; we approximate with short
          repeating strokes that read as patterning at any size. */}
      {[160, 188, 215].map((cy, bandIdx) => (
        <React.Fragment key={`band-${bandIdx}`}>
          {/* Band top + bottom rails */}
          <Path
            d={`M 70 ${cy - 5} Q 120 ${cy - 9}, 175 ${cy - 3}`}
            fill="none"
            stroke={Color.shankhaCopper}
            strokeWidth="1"
            strokeOpacity="0.85"
          />
          <Path
            d={`M 70 ${cy + 5} Q 120 ${cy + 9}, 175 ${cy + 3}`}
            fill="none"
            stroke={Color.shankhaCopper}
            strokeWidth="1"
            strokeOpacity="0.85"
          />
          {/* Floral / geometric repeats inside the band */}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 78 + i * 11;
            const yTop = cy - 5 + (i / 8) * 2;
            const yBot = cy + 5 - (i / 8) * 2;
            return (
              <Path
                key={`band-${bandIdx}-mark-${i}`}
                d={`M ${x} ${yTop + 1} Q ${x + 2} ${cy}, ${x} ${yBot - 1}`}
                fill="none"
                stroke={Color.shankhaCopper}
                strokeWidth="0.8"
                strokeOpacity="0.7"
              />
            );
          })}
        </React.Fragment>
      ))}

      {/* ── Mouth opening — dark copper interior at the bottom-right
          where the conch flares open. Captures the deep interior
          tone visible in both reference images. */}
      <Path
        d="M 130 188
           Q 152 198, 168 220
           Q 178 238, 158 245
           Q 130 248, 115 235
           Q 108 222, 122 200 Z"
        fill="url(#mouth)"
        stroke="url(#rim)"
        strokeWidth="1.5"
      />

      {/* ── Highlight crescent — soft glint on the body's upper-left
          curve so the conch reads as 3D and divinely lit. */}
      <Path
        d="M 78 130
           Q 66 160, 70 195"
        fill="none"
        stroke={Color.shankhaCream}
        strokeWidth="3"
        strokeOpacity="0.55"
        strokeLinecap="round"
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
