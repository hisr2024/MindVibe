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
  // Realistic Shankha (शङ्ख) — Krishna's conch.
  //
  // Previous version traced a single curve that read on-screen as an abstract
  // crescent / pac-man shape. Replaced with a proper conch silhouette:
  //   • A pointed spire at the top with three visible whorl ridges (the
  //     spiral coils of the shell apex).
  //   • A bulging body that widens at the shoulder and tapers at the base.
  //   • A clear aperture (mouth) opening on the right side, with a darker
  //     inner cavity and a bright golden lip showing where sound emerges.
  //   • A subtle spiral hint visible through the aperture mouth.
  //
  // Two gradients (cream radial body, copper-to-gold rim) keep it lit
  // realistically. The aperture inner cavity uses its own dim gold so the
  // mouth reads as DEPTH, not a flat shape.
  return (
    <Svg width={size} height={size} viewBox="0 0 200 220">
      <Defs>
        <RadialGradient id="conchBody" cx="42%" cy="35%" r="70%">
          <Stop offset="0%" stopColor={Color.shankhaCream} stopOpacity="1" />
          <Stop offset="55%" stopColor={Color.shankhaIvory} stopOpacity="1" />
          <Stop offset="100%" stopColor={Color.shankhaCopper} stopOpacity="0.55" />
        </RadialGradient>
        <LinearGradient id="conchRim" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={Color.divineGoldBright} stopOpacity="0.95" />
          <Stop offset="50%" stopColor={Color.divineGold} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={Color.shankhaCopper} stopOpacity="0.7" />
        </LinearGradient>
        <RadialGradient id="conchAperture" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor={Color.shankhaCopper} stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#1A0E04" stopOpacity="0.85" />
        </RadialGradient>
      </Defs>

      {/* ---------- Outer body silhouette ----------
          Spire tip at (95, 12), curls down-left into a wide belly, then back
          up the right side around the aperture and tucks under itself. */}
      <Path
        d="M 95 12
           C 75 18, 55 45, 48 80
           C 42 115, 48 150, 70 175
           C 90 196, 120 200, 145 188
           C 168 178, 178 158, 175 135
           C 172 115, 158 100, 138 95
           C 122 92, 108 100, 105 115
           C 103 128, 113 138, 125 135
           C 134 132, 138 122, 132 115
           Z"
        fill="url(#conchBody)"
        stroke="url(#conchRim)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ---------- Spire whorls ----------
          Three nested arcs at the top show the spiral coils of the apex. */}
      <Path
        d="M 90 22 C 78 28, 72 42, 80 54"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.6"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 88 38 C 74 46, 70 60, 80 72"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.5"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 82 56 C 68 66, 65 82, 78 92"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.4"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* ---------- Aperture (mouth) ----------
          The opening on the right side. Filled with a dim radial gradient
          so it reads as a real cavity rather than a flat shape. */}
      <Path
        d="M 138 110
           C 156 110, 168 122, 168 140
           C 168 158, 156 172, 138 174
           C 122 175, 112 165, 112 148
           C 112 130, 122 115, 138 110
           Z"
        fill="url(#conchAperture)"
        stroke="url(#conchRim)"
        strokeWidth="1.6"
      />

      {/* ---------- Aperture lip highlight ----------
          A bright golden curve along the inside of the lip — this is the
          edge that catches light when sound emerges from the conch. */}
      <Path
        d="M 152 120
           C 162 126, 165 138, 162 150
           C 159 162, 150 168, 140 168"
        stroke={Color.divineGoldBright}
        strokeOpacity="0.8"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* ---------- Inner spiral hint ----------
          A small curl visible deep inside the mouth — suggests the
          continuing spiral that runs the full length of the conch. */}
      <Path
        d="M 135 138 C 142 140, 146 148, 142 155"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.7"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* ---------- Body banding (subtle) ----------
          Two faint horizontal-ish ridges across the body suggest the
          natural growth bands on a real conch. Kept very subtle so the
          shell reads as smooth at small sizes. */}
      <Path
        d="M 55 95 C 75 100, 100 100, 118 95"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.18"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M 58 130 C 78 138, 100 138, 115 132"
        stroke={Color.shankhaCopper}
        strokeOpacity="0.18"
        strokeWidth="1"
        fill="none"
      />

      {/* ---------- Highlight catch ----------
          A small bright crescent on the left of the body — the lit side. */}
      <Path
        d="M 60 70 C 56 90, 56 115, 62 138"
        stroke={Color.shankhaCream}
        strokeOpacity="0.5"
        strokeWidth="2"
        fill="none"
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
